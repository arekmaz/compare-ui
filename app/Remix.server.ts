import { HttpClient } from '@effect/platform';
import { LoaderFunctionArgs } from '@remix-run/node';
import { Effect, Layer, ManagedRuntime } from 'effect';

export class RemixArgs extends Effect.Tag('RemixArgs')<
  RemixArgs,
  Pick<LoaderFunctionArgs, 'request' | 'response'> & {
    ctx: LoaderFunctionArgs['context'];
  }
>() {}

export const makeRemixRuntime = <R>(layer: Layer.Layer<R, never, never>) => {
  const runtime = ManagedRuntime.make(layer);

  const loaderFunction = <A, E>(
    body: Effect.Effect<Effect.Effect<A, E, R | RemixArgs>, never, R>
  ) => {
    const makeLoaderPromise = runtime.runPromise(body);

    return (args: LoaderFunctionArgs) =>
      makeLoaderPromise.then((effect) =>
        runtime.runPromise(
          effect.pipe(
            Effect.provideService(
              RemixArgs,
              RemixArgs.of({ ...args, ctx: args.context })
            )
          )
        )
      );
  };

  return { loaderFunction, runtime };
};

export const { loaderFunction, runtime } = makeRemixRuntime(HttpClient.layer);
