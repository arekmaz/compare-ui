import { useLoaderData, useSearchParams } from '@remix-run/react';
import { Effect, Schedule } from 'effect';
import { loaderFunction } from '~/Remix.server';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { matchSorter } from 'match-sorter';
import { allScrapers } from '~/scrapers';
import { HttpClient } from '@effect/platform';
import { NoSuchElementException } from 'effect/Cause';
import { HttpClientError } from '@effect/platform/HttpClientError';

const isDev = process.env.NODE_ENV === 'development';

export const loader = loaderFunction(
  Effect.gen(function* () {
    const cachedEffects: Effect.Effect<
      {
        components: {
          name: string;
          url: string;
        }[];
        name: string;
        site: string;
        loadedAt: Date;
      } | null,
      never
    >[] = [];

    for (const scraper of allScrapers) {
      const [cached, invalidate] = yield* scraper.pipe(
        Effect.filterOrFail(({ components }) => components.length > 0),
        Effect.map(({ components, ...rest }) => ({
          ...rest,
          components: components.map(({ name, ...c }) => ({
            ...c,
            name: name.trim(),
          })),
        })),
        Effect.retry({
          schedule: Schedule.intersect(
            Schedule.jittered(Schedule.exponential('200 millis')),
            Schedule.recurs(5)
          ),
        }),
        Effect.cachedInvalidateWithTTL(isDev ? 0 : '24 hours')
      );

      cachedEffects.push(
        cached.pipe(
          Effect.tapError(() => invalidate),
          Effect.orElseSucceed(() => null)
        )
      );
    }

    return Effect.all(
      cachedEffects.map((effect) => Effect.orElseSucceed(effect, () => null)),
      { concurrency: 'unbounded' }
    ).pipe(
      Effect.map((data) =>
        data
          .filter((a) => a !== null)
          .sort((a, b) => (a.name > b.name ? 1 : -1))
      ),
      Effect.map((data) => ({ status: 'success' as const, data })),
      Effect.catchAll((error) =>
        Effect.succeed({ status: 'error' as const, error })
      )
    );
  })
);

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();

  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();

  const [searchPhrase, setSearchPhrase] = useState(() => {
    return searchParams.get('s') ?? '';
  });

  const allComponentNames = useMemo(() => {
    if (loaderData.status === 'error') {
      return [];
    }

    return Array.from(
      new Set(
        loaderData.data.flatMap(({ components }) =>
          components.map((component) => component.name)
        )
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [visibleComponents, setVisibleComponents] = useState(() => {
    if (loaderData.status === 'error') {
      return [];
    }

    return matchSorter(allComponentNames, searchPhrase);
  });

  useEffect(() => {
    setTimeout(() => {
      setSearchParams((p) => ({ ...p, s: searchPhrase }));

      startTransition(() => {
        const matches = matchSorter(allComponentNames, searchPhrase);
        setVisibleComponents(matches.length > 0 ? matches : allComponentNames);
      });
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchPhrase]);

  if (loaderData.status === 'error') {
    return <div>ups, error</div>;
  }

  const collections = loaderData.data;

  return (
    <table className="text-center">
      <thead className="sticky top-0 bg-white/90 py-2">
        <tr>
          <th className="sticky left-0 top-0 bg-white z-50">
            <input
              value={searchPhrase}
              onChange={(e) => {
                setSearchPhrase(e.target.value);
              }}
              placeholder="Search"
              className="rounded-md border border-stone-600 px-1 py-2"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </th>
          {collections.map((collection) => (
            <th key={collection.name}>
              <div className="flex flex-col items-center gap-1 pt-1">
                <a
                  href={collection.site}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg/4"
                >
                  {collection.name}
                </a>
                <span className="text-xs text-stone-500 font-thin">
                  {collection.components.length}
                </span>
              </div>
            </th>
          ))}
        </tr>
        <tr className="text-stone-400">
          <th className="text-black text-base sticky left-0 top-0 bg-white z-10">
            Component
          </th>
          {collections.map((collection) => (
            <th className="text-[8px] font-thin" key={collection.name}>
              {collection.loadedAt}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {visibleComponents.map((component) => (
          <tr key={component} className="group/row">
            <td className="sticky left-0 bg-white group-hover/row:bg-stone-200">
              {component}
            </td>
            {collections.map(({ components }, index) => {
              const matchingComponent = components.find(
                (cmp) => cmp.name === component
              );

              if (!matchingComponent) {
                return (
                  <td key={index} className="group-hover/row:bg-stone-200"></td>
                );
              }

              return (
                <td key={index} className="group-hover/row:bg-stone-200">
                  <a
                    href={matchingComponent.url}
                    target="_blank"
                    rel="noreferrer"
                    className="pointer-events-auto"
                  >
                    {'✅'}
                  </a>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
