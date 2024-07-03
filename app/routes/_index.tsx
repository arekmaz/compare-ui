import type { MetaFunction } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import { Effect, Schedule, String } from 'effect';
import { JSDOM } from 'jsdom';
import { loaderFunction } from '~/Remix.server';
import { HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { matchSorter } from 'match-sorter';

const isDev = process.env.NODE_ENV === 'development';

const splitCamelcase = (s: string) => s.replaceAll(/([a-z])([A-Z])/g, '$1 $2');
const capitalizeSubsequentWords = (s: string) =>
  s.replaceAll(/\s[a-z]/g, (match) => match.toUpperCase());

export const meta: MetaFunction = () => {
  return [
    { title: 'Compare UI' },
    { name: 'description', content: 'Compare UI Component Libs' },
  ];
};

const extractElements = (pageContent: string, selector: string) => {
  const jsdom = new JSDOM(pageContent);

  return Array.from(jsdom.window.document.querySelectorAll(selector));
};

const scrapeComponentLinks = ({
  url,
  base,
  linkSelector,
}: {
  url: string;
  linkSelector: string;
  base: string;
}) =>
  HttpClientRequest.get(url).pipe(
    HttpClientResponse.text,
    Effect.map((text) => extractElements(text, linkSelector)),
    Effect.map((elements) => {
      const links = elements as HTMLLinkElement[];

      const components = links.map((el) => {
        const link = el;
        return {
          name: link.firstChild!.textContent!,
          url: `${base}${link.href}`,
        };
      });

      return { loadedAt: new Date(), components };
    })
  );

const scrapeGithubDirectoryFileLinks = ({
  url,
  base,
  linkSelector,
}: {
  url: string;
  linkSelector: string;
  base: string;
}) =>
  HttpClientRequest.get(url).pipe(
    HttpClientResponse.text,
    Effect.map((text) => extractElements(text, linkSelector)),
    Effect.map((links) => {
      const components = links.map((el) => {
        const link = el as HTMLLinkElement;
        const pascalName = String.snakeToPascal(
          String.kebabToSnake(
            link.firstChild!.textContent!.replace(/\..+$/, '')
          )
        ).replace(/\d+$/, '');

        return {
          name: pascalName,
          url: `${base}${pascalName}`,
        };
      });

      return { loadedAt: new Date(), components };
    })
  );

const scrapeGithubDirectoryFolderLinks = ({
  url,
  base,
  linkSelector,
}: {
  url: string;
  linkSelector: string;
  base: string;
}) =>
  HttpClientRequest.get(url).pipe(
    HttpClientResponse.text,
    Effect.map((text) => extractElements(text, linkSelector)),
    Effect.map((links) =>
      links.filter((link) => !link?.firstChild?.textContent?.includes('.'))
    ),
    Effect.map((links) => {
      const components = links.map((el) => {
        const link = el as HTMLLinkElement;
        const pascalName = String.snakeToPascal(
          String.kebabToSnake(link.firstChild!.textContent!)
        ).replace(/\d+$/, '');

        return {
          name: pascalName,
          url: `${base}${pascalName}`,
        };
      });

      return { loadedAt: new Date(), components };
    })
  );

const shadCn = scrapeComponentLinks({
  url: 'https://ui.shadcn.com/docs',
  base: 'https://ui.shadcn.com',
  linkSelector:
    'body > div:nth-child(2) > div > main > div > div > aside > div > div > div > div > div:nth-child(2) > div > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Shadcn',
    site: 'https://ui.shadcn.com',
  }))
);

const arkUi = scrapeComponentLinks({
  url: 'https://ark-ui.com/react/docs/overview/introduction',
  base: 'https://ark-ui.com',
  linkSelector: 'aside > nav > ul > li:nth-child(3) > div > div > ul > li > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'ArkUI',
    site: 'https://ark-ui.com',
  }))
);

const zagJs = scrapeComponentLinks({
  url: 'https://zagjs.com/overview/introduction',
  base: 'https://zagjs.com',
  linkSelector: 'nav > ul > li:nth-child(2) > ul > li > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'ZagJS',
    site: 'https://zagjs.com',
  }))
);

const nextUi = scrapeComponentLinks({
  url: 'https://nextui.org/docs/guide/introduction',
  base: 'https://nextui.org',
  linkSelector:
    '#app-container > main > div > div.hidden.overflow-visible.relative.z-10.lg\\:block.lg\\:col-span-2.mt-8.pr-4 > div > div > div > div > ul:nth-child(4) > div.flex.flex-col.gap-3.items-start > li > div > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Next UI',
    site: 'https://nextui.org',
  }))
);

const baseUi = scrapeComponentLinks({
  url: 'https://mui.com/base-ui/all-components/',
  base: 'https://mui.com',
  linkSelector:
    '#__next > div > nav > div > div > div.MuiBox-root > div > ul > li:nth-child(2) > div > div > div > ul > li > ul > li > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Base UI',
    site: 'https://mui.com/base-ui',
  }))
);

const arekUi = scrapeGithubDirectoryFileLinks({
  url: 'https://github.com/arekmaz/arek-ui/tree/main/app/components/ui',
  base: 'https://arek-ui.fly.dev/?q=',
  linkSelector:
    'table > tbody > tr > td.react-directory-row-name-cell-large-screen > div > div > div > div > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    components: components.map(({ name, ...c }) => ({
      ...c,
      name: splitCamelcase(name),
    })),
  })),
  Effect.map((data) => ({
    ...data,
    name: 'Arek UI',
    site: 'https://arek-ui.fly.dev/',
  }))
);

const headlessUi = scrapeComponentLinks({
  url: 'https://headlessui.com/',
  base: 'https://headlessui.com/react/',
  linkSelector:
    '#__next > div > div > main > div > div > div > a > div:nth-child(2)',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Headless UI',
    site: 'https://headlessui.com',
  }))
);

const daisyUi = scrapeComponentLinks({
  url: 'https://daisyui.com/components/',
  base: 'https://daisyui.com/components/',
  linkSelector: '.card-title',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Daisy UI',
    site: 'https://daisyui.com',
  }))
);

const materialUi = scrapeComponentLinks({
  url: 'https://mui.com/material-ui/all-components/',
  base: 'https://mui.com',
  linkSelector:
    '#__next > div > nav > div > div > div.MuiBox-root > div > ul > li:nth-child(2) > div > div > div > ul > li > ul > li > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    name: 'Material UI',
    site: 'https://mui.com',
    components: components.filter(
      (component) =>
        ![/about-the-lab/, /react-use-media-query/].some((re) =>
          re.test(component.url)
        )
    ),
  }))
);

const reactAria = scrapeComponentLinks({
  url: 'https://react-spectrum.adobe.com/react-aria/components.html',
  base: 'https://react-spectrum.adobe.com/',
  linkSelector: 'nav > details:nth-child(8) > ul > li > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    components: components.map(({ name, ...c }) => ({
      ...c,
      name: splitCamelcase(name),
    })),
  })),
  Effect.map((data) => ({
    ...data,
    name: 'React Aria',
    site: 'https://react-spectrum.adobe.com/react-aria',
  }))
);

const parkUi = scrapeComponentLinks({
  url: 'https://park-ui.com/docs/panda/components/accordion',
  base: 'https://park-ui.com',
  linkSelector:
    '#sidebar > astro-island:nth-child(1)> aside:nth-child(1) > nav:nth-child(1) > ul.d_flex > li:nth-child(4) > #collapsible\\:\\:r24R4\\: > #collapsible\\:\\:r24R4\\:\\:content > ul:nth-child(1) > li > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Park UI',
    site: 'https://park-ui.com',
  }))
);

const reactBootstrap = scrapeComponentLinks({
  url: 'https://react-bootstrap.github.io/docs/components/accordion',
  base: 'https://react-bootstrap.github.io',
  linkSelector:
    '#__docusaurus_skipToContent_fallback > div > div > aside > div > div > nav > ul > li:nth-child(4) > ul > li > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'React Boostrap',
    site: 'https://react-bootstrap.github.io',
    components: data.components.map(({ name, ...cmp }) => ({
      ...cmp,
      name: capitalizeSubsequentWords(name.replace(/s$/, '')),
    })),
  }))
);

const antDesign = scrapeGithubDirectoryFolderLinks({
  url: 'https://github.com/ant-design/ant-design/tree/master/components',
  base: 'https://ant.design/',
  linkSelector:
    'table > tbody > tr > td.react-directory-row-name-cell-large-screen > div > div > div > div > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    components: components
      .filter(({ name }) => !name.startsWith('_'))
      .map(({ name, ...c }) => ({
        ...c,
        name: splitCamelcase(name),
      })),
  })),
  Effect.map((data) => ({
    ...data,
    name: 'Ant Design',
    site: 'https://ant.design/',
  }))
);

const semanticUi = scrapeComponentLinks({
  url: 'https://semantic-ui.com/elements/button.html',
  base: 'https://semantic-ui.com',
  linkSelector:
    'div.toc > div:nth-child(1) > div:nth-child(n+7):nth-child(-n+10) > div:nth-child(2) > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Semantic UI',
    site: 'https://semantic-ui.com',
  }))
);

const blueprintJs = scrapeGithubDirectoryFolderLinks({
  url: 'https://github.com/palantir/blueprint/tree/develop/packages/core/src/components',
  base: 'https://blueprintjs.com/docs/',
  linkSelector:
    'table > tbody > tr > td.react-directory-row-name-cell-large-screen > div > div > div > div > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    components: components.map(({ name, ...c }) => ({
      ...c,
      name: splitCamelcase(name),
    })),
  })),
  Effect.map((data) => ({
    ...data,
    name: 'Blueprint JS',
    site: 'https://blueprintjs.com',
  }))
);

const themeUi = scrapeComponentLinks({
  url: 'https://theme-ui.com/components/alert',
  base: 'https://theme-ui.com',
  linkSelector: 'div.css-2bq4yr > ul > li:nth-child(11)> ul > li > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    name: 'Theme UI',
    site: 'https://theme-ui.com',
    components: components.filter(
      (component) => ![/variants/].some((re) => re.test(component.url))
    ),
  }))
);

const chakraUi = scrapeComponentLinks({
  url: 'https://chakra-ui.com/docs/components/accordion',
  base: 'https://chakra-ui.com',
  linkSelector: 'nav.sidebar-content > div > div > div > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Chakra UI',
    site: 'https://chakra-ui.com',
  }))
);

export const loader = loaderFunction(
  Effect.gen(function* () {
    const collectionEffects = [
      shadCn,
      arkUi,
      zagJs,
      nextUi,
      baseUi,
      arekUi,
      materialUi,
      reactAria,
      parkUi,
      reactBootstrap,
      antDesign,
      semanticUi,
      blueprintJs,
      themeUi,
      chakraUi,
      headlessUi,
      daisyUi,
    ].map((effect) =>
      effect.pipe(
        Effect.map(({ components, ...rest }) => ({
          ...rest,
          components: components.map(({ name, ...c }) => ({
            ...c,
            name: name.trim(),
          })),
        })),
        Effect.orElseSucceed(() => null),
        Effect.retry({
          schedule: Schedule.intersect(
            Schedule.jittered(Schedule.exponential('200 millis')),
            Schedule.recurs(5)
          ),
        }),
        Effect.cachedWithTTL(isDev ? 0 : '24 hours')
      )
    );

    const cachedEffects = yield* Effect.all(collectionEffects);

    return Effect.all(cachedEffects, { concurrency: 'unbounded' }).pipe(
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
    <div className="font-sans p-4 flex flex-col gap-5">
      <table className="text-center">
        <thead className="sticky top-0 bg-white/90 py-2">
          <tr>
            <th className="sticky left-0 bg-white">
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
                <div className="flex flex-col items-center gap-1">
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
            <tr key={component} className="hover:bg-stone-100">
              <td className="sticky left-0 bg-white z-0">{component}</td>
              {collections.map(({ components }, index) => {
                const matchingComponent = components.find(
                  (cmp) => cmp.name === component
                );

                if (!matchingComponent) {
                  return <td key={index}></td>;
                }

                return (
                  <td key={index}>
                    <a
                      href={matchingComponent.url}
                      target="_blank"
                      rel="noreferrer"
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
    </div>
  );
}
