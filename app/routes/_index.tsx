import type { MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Effect, String } from 'effect';
import { JSDOM } from 'jsdom';
import { loaderFunction } from '~/Remix.server';
import { HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { useMemo } from 'react';

const isDev = process.env.NODE_ENV === 'development';

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

export const loader = loaderFunction(
  Effect.gen(function* () {
    const cached = yield* Effect.all([
      scrapeComponentLinks({
        url: 'https://ui.shadcn.com/docs',
        base: 'https://ui.shadcn.com',
        linkSelector:
          'body > div:nth-child(2) > div > main > div > div > aside > div > div > div > div > div:nth-child(2) > div > a',
      }).pipe(Effect.map((data) => ({ ...data, name: 'Shadcn' }))),
      scrapeComponentLinks({
        url: 'https://ark-ui.com/react/docs/overview/introduction',
        base: 'https://ark-ui.com',
        linkSelector:
          'aside > nav > ul > li:nth-child(3) > div > div > ul > li > a',
      }).pipe(Effect.map((data) => ({ ...data, name: 'ArkUI' }))),
      scrapeComponentLinks({
        url: 'https://zagjs.com/overview/introduction',
        base: 'https://zagjs.com',
        linkSelector: 'nav > ul > li:nth-child(2) > ul > li > a',
      }).pipe(Effect.map((data) => ({ ...data, name: 'ZagJS' }))),
      scrapeComponentLinks({
        url: 'https://nextui.org/docs/guide/introduction',
        base: 'https://nextui.org',
        linkSelector:
          '#app-container > main > div > div.hidden.overflow-visible.relative.z-10.lg\\:block.lg\\:col-span-2.mt-8.pr-4 > div > div > div > div > ul:nth-child(4) > div.flex.flex-col.gap-3.items-start > li > div > a',
      }).pipe(Effect.map((data) => ({ ...data, name: 'Next UI' }))),
      scrapeComponentLinks({
        url: 'https://mui.com/base-ui/all-components/',
        base: 'https://mui.com',
        linkSelector:
          '#__next > div > nav > div > div > div.MuiBox-root > div > ul > li:nth-child(2) > div > div > div > ul > li > ul > li > a',
      }).pipe(Effect.map((data) => ({ ...data, name: 'Base UI' }))),
      scrapeGithubDirectoryFileLinks({
        url: 'https://github.com/arekmaz/arek-ui/tree/main/app/components/ui',
        base: 'https://arek-ui.fly.dev/?q=',
        linkSelector:
          'table > tbody > tr > td.react-directory-row-name-cell-large-screen > div > div > div > div > a',
      }).pipe(Effect.map((data) => ({ ...data, name: 'Arek UI' }))),
      scrapeComponentLinks({
        url: 'https://mui.com/material-ui/all-components/',
        base: 'https://mui.com',
        linkSelector:
          '#__next > div > nav > div > div > div.MuiBox-root > div > ul > li:nth-child(2) > div > div > div > ul > li > ul > li > a',
      }).pipe(
        Effect.map(({ components, ...rest }) => ({
          ...rest,
          name: 'Material UI',
          components: components.filter(
            (component) =>
              ![/about-the-lab/, /react-use-media-query/].some((re) =>
                re.test(component.url)
              )
          ),
        }))
      ),
      scrapeComponentLinks({
        url: 'https://react-spectrum.adobe.com/react-aria/components.html',
        base: 'https://react-spectrum.adobe.com/',
        linkSelector: 'nav > details:nth-child(8) > ul > li > a',
      }).pipe(Effect.map((data) => ({ ...data, name: 'React Aria' }))),
      scrapeComponentLinks({
        url: 'https://park-ui.com/docs/panda/components/accordion',
        base: 'https://park-ui.com',
        linkSelector:
          '#sidebar > astro-island:nth-child(1)> aside:nth-child(1) > nav:nth-child(1) > ul.d_flex > li:nth-child(4) > #collapsible\\:\\:r24R4\\: > #collapsible\\:\\:r24R4\\:\\:content > ul:nth-child(1) > li > a',
      }).pipe(Effect.map((data) => ({ ...data, name: 'Park UI' }))),
    ]).pipe(Effect.cachedWithTTL(isDev ? 0 : '24 hours'));

    return cached;
  })
);

export default function Index() {
  const collections = useLoaderData<typeof loader>();

  const allPossibilities = useMemo(() => {
    return Array.from(
      new Set(
        collections.flatMap(({ components }) =>
          components.map((component) => component.name)
        )
      )
    );
  }, [collections]);

  return (
    <div className="font-sans p-4 flex flex-col gap-5">
      <h1 className="text-5xl text-center">Compare UI</h1>
      <table className="text-center">
        <thead className="sticky top-0 bg-white/90 py-2">
          <tr>
            <th></th>
            {collections.map((collection) => (
              <th key={collection.name}>
                {collection.name} {collection.components.length}
              </th>
            ))}
          </tr>
          <tr className="text-xs text-stone-400">
            <th className="text-black text-base">Component</th>
            {collections.map((collection) => (
              <th key={collection.name}>{collection.loadedAt}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allPossibilities.map((component) => (
            <tr key={component} className="hover:bg-stone-100">
              <td>{component}</td>
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
