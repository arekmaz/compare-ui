import { Effect, String } from 'effect';
import { JSDOM } from 'jsdom';
import { HttpClientRequest, HttpClientResponse } from '@effect/platform';

export const splitCamelcase = (s: string) =>
  s.replaceAll(/([a-z])([A-Z])/g, '$1 $2');
export const capitalizeSubsequentWords = (s: string) =>
  s.replaceAll(/\s[a-z]/g, (match) => match.toUpperCase());

export const extractElements = (pageContent: string, selector: string) => {
  const jsdom = new JSDOM(pageContent);

  return Array.from(jsdom.window.document.querySelectorAll(selector));
};

export const scrapeComponentLinks = ({
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

export const scrapeGithubDirectoryFileLinks = ({
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

export const scrapeGithubDirectoryFolderLinks = ({
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
