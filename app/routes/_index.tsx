import type { MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Effect, String } from 'effect';
import { JSDOM } from 'jsdom';
import { loaderFunction, runtime } from '~/Remix.server';
import { HttpClientRequest, HttpClientResponse } from '@effect/platform';

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
    Effect.map((links) => {
      const components = links.map((el) => {
        const link = el as HTMLLinkElement;
        return {
          name: link.textContent!.replaceAll(/\.css.*}/g, ''),
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
            link.textContent!.replaceAll(/\.css.*}/g, '').replace(/\..+$/, '')
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

const cached = runtime.runSync(
  Effect.all({
    shadcn: scrapeComponentLinks({
      url: 'https://ui.shadcn.com/docs',
      base: 'https://ui.shadcn.com',
      linkSelector:
        'body > div:nth-child(2) > div > main > div > div > aside > div > div > div > div > div:nth-child(2) > div > a',
    }),
    arkUi: scrapeComponentLinks({
      url: 'https://ark-ui.com/react/docs/overview/introduction',
      base: 'https://ark-ui.com',
      linkSelector:
        'aside > nav > ul > li:nth-child(3) > div > div > ul > li > a',
    }),
    zagJs: scrapeComponentLinks({
      url: 'https://zagjs.com/overview/introduction',
      base: 'https://zagjs.com',
      linkSelector: 'nav > ul > li:nth-child(2) > ul > li > a',
    }),
    nextUi: scrapeComponentLinks({
      url: 'https://nextui.org/docs/guide/introduction',
      base: 'https://nextui.org',
      linkSelector:
        '#app-container > main > div > div.hidden.overflow-visible.relative.z-10.lg\\:block.lg\\:col-span-2.mt-8.pr-4 > div > div > div > div > ul:nth-child(4) > div.flex.flex-col.gap-3.items-start > li > div > a',
    }),
    baseUi: scrapeComponentLinks({
      url: 'https://mui.com/base-ui/all-components/',
      base: 'https://mui.com',
      linkSelector:
        '#__next > div > nav > div > div > div.MuiBox-root > div > ul > li:nth-child(2) > div > div > div > ul > li > ul > li > a',
    }),
    arekUi: scrapeGithubDirectoryFileLinks({
      url: 'https://github.com/arekmaz/arek-ui/tree/main/app/components/ui',
      base: 'https://arek-ui.fly.dev/?q=',
      linkSelector:
        'table > tbody > tr > td.react-directory-row-name-cell-large-screen > div > div > div > div > a',
    }),
    materialUi: scrapeComponentLinks({
      url: 'https://mui.com/material-ui/all-components/',
      base: 'https://mui.com',
      linkSelector:
        '#__next > div > nav > div > div > div.MuiBox-root > div > ul > li:nth-child(2) > div > div > div > ul > li > ul > li > a',
    }),
    parkUi: scrapeComponentLinks({
      url: 'https://park-ui.com/docs/panda/components/',
      base: 'https://park-ui.com',
      linkSelector:
        '#sidebar > astro-island:nth-child(1)> aside:nth-child(1) > nav:nth-child(1) > ul.d_flex > li:nth-child(4) > #collapsible\\:\\:r24R4\\: > #collapsible\\:\\:r24R4\\:\\:content > ul:nth-child(1) > li > a',
    }),
    reactAria: scrapeComponentLinks({
      url: 'https://react-spectrum.adobe.com/react-aria/components.html',
      base: 'https://react-spectrum.adobe.com/',
      linkSelector:
        'nav > details:nth-child(8) > ul > li > a',
    }),
    
  }).pipe(Effect.cachedWithTTL(isDev ? 0 : '24 hours'))
);

export const loader = loaderFunction(() => cached);

export default function Index() {
  const { zagJs, shadcn, arkUi, nextUi, baseUi, arekUi, materialUi, parkUi, reactAria } =
    useLoaderData<typeof loader>();

  return (
    <div className="font-sans p-4 flex flex-col gap-5">
      <h1 className="text-5xl">Compare UI effect</h1>

      <div className="flex gap-5">
        <ComponentsSection title="Shadcn" {...shadcn} />
        <ComponentsSection title="Ark UI" {...arkUi} />
        <ComponentsSection title="ZagJS" {...zagJs} />
        <ComponentsSection title="NextUI" {...nextUi} />
        <ComponentsSection title="BaseUI" {...baseUi} />
        <ComponentsSection title="ArekUI" {...arekUi} />
        <ComponentsSection title="MaterialUI" {...materialUi} />
        <ComponentsSection title="ParkUI" {...parkUi} />
        <ComponentsSection title="React Aria" {...reactAria} />
      </div>
    </div>
  );
}

const ComponentsSection = (props: {
  components: { name: string; url: string }[];
  loadedAt: string;
  title: string;
}) => {
  const { loadedAt, components, title } = props;

  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-3xl">
        {title} {components.length}
      </h3>
      <span className="text-xs text-stone-600">Loaded at {loadedAt}</span>
      <ul className="flex flex-col gap-2">
        {components.map((component) => (
          <a
            key={component.url}
            href={component.url}
            target="_blank"
            rel="noreferrer"
          >
            {component.name}
          </a>
        ))}
      </ul>
    </section>
  );
};
