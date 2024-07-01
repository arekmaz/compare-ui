import { HttpClient } from '@effect/platform';
import { LoaderFunction } from '@remix-run/node';
import { Layer, ManagedRuntime, Effect } from 'effect';

export const makeRemixRuntime = <R, E>(layer: Layer.Layer<R, E, never>) => {
  const runtime = ManagedRuntime.make(layer);

  const loaderFunction =
    <A, E>(
      body: (...args: Parameters<LoaderFunction>) => Effect.Effect<A, E, R>
    ): {
      (...args: Parameters<LoaderFunction>): Promise<A>;
    } =>
    (...args) =>
      runtime.runPromise(body(...args));

  return { loaderFunction, runtime };
};

export const { loaderFunction, runtime } = makeRemixRuntime(HttpClient.layer);
