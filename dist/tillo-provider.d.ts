type TilloProviderOptions = {
    url: string;
    fetch: any;
    entity: Record<string, any>;
    debug: boolean;
};
declare function TilloProvider(this: any, options: TilloProviderOptions): {
    exports: {};
};
export default TilloProvider;
