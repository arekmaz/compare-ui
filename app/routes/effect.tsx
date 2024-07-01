import type { MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Effect } from 'effect';
import { JSDOM } from 'jsdom';
import { loaderFunction } from '~/Remix.server';
import {
  HttpClientRequest,
  HttpClientResponse,
  HttpClient,
} from '@effect/platform';

export const meta: MetaFunction = () => {
  return [
    { title: 'Compare UI' },
    { name: 'description', content: 'Compare UI Component Libs' },
  ];
};

const scrapeComponentLinks = ({
  url,
  base,
  selector,
}: {
  url: string;
  selector: string;
  base: string;
}) =>
  HttpClientRequest.get(url).pipe(
    HttpClientResponse.text,
    Effect.map((text) => {
      const jsdom = new JSDOM(text);

      const components = Array.from(
        jsdom.window.document.querySelectorAll(selector)
      ).map((c) => {
        const link = c as HTMLLinkElement;
        return {
          name: link.textContent!.replaceAll(/\.css.*}/g, ''),
          url: `${base}${link.href}`,
        };
      });

      return { loadedAt: new Date(), components };
    })
  );

export const loader = loaderFunction(() =>
  Effect.all({
    shadcn: scrapeComponentLinks({
      url: 'https://ui.shadcn.com/docs',
      base: 'https://ui.shadcn.com',
      selector:
        'body > div:nth-child(2) > div > main > div > div > aside > div > div > div > div > div:nth-child(2) > div > a',
    }),
    arkUi: scrapeComponentLinks({
      url: 'https://ark-ui.com/react/docs/overview/introduction',
      base: 'https://ark-ui.com',
      selector: 'aside > nav > ul > li:nth-child(3) > div > div > ul > li > a',
    }),
    zagJs: scrapeComponentLinks({
      url: 'https://zagjs.com/overview/introduction',
      base: 'https://zagjs.com',
      selector: 'nav > ul > li:nth-child(2) > ul > li > a',
    }),
  })
);

const ComponentsSection = (props: {
  components: { name: string; url: string }[];
  loadedAt: string;
  title: string;
}) => {
  const { loadedAt, components, title } = props;

  return (
    <section>
      <h3 className="text-3xl">
        {title} {components.length}
      </h3>
      <span className="text-3xl">Loaded at {loadedAt}</span>
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

export default function Index() {
  const { zagJs, shadcn, arkUi } = useLoaderData<typeof loader>();

  return (
    <div className="font-sans p-4 flex flex-col gap-5">
      <h1 className="text-5xl">Compare UI effect</h1>

      <div className="flex gap-5">
        <ComponentsSection title="Shadcn" {...shadcn} />
        <ComponentsSection title="Ark UI" {...arkUi} />
        <ComponentsSection title="ZagJS" {...zagJs} />
      </div>
    </div>
  );
}
