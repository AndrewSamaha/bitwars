module.exports = [
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/convertToList.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "convertToList",
    ()=>convertToList
]);
"use strict";
const convertToList = (input, transform, forceTransform = false)=>{
    if (!Array.isArray(input)) {
        input = [
            input
        ];
    }
    if (!transform) {
        return input;
    }
    return input.map((item)=>{
        if (typeof item === "string" || forceTransform) {
            return transform(item);
        }
        return item;
    });
};
;
 //# sourceMappingURL=convertToList.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/cache/Cache.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Cache",
    ()=>Cache
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/convertToList.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class CacheClass {
    constructor(){
        this._parsers = [];
        this._cache = /* @__PURE__ */ new Map();
        this._cacheMap = /* @__PURE__ */ new Map();
    }
    /** Clear all entries. */ reset() {
        this._cacheMap.clear();
        this._cache.clear();
    }
    /**
   * Check if the key exists
   * @param key - The key to check
   */ has(key) {
        return this._cache.has(key);
    }
    /**
   * Fetch entry by key
   * @param key - The key of the entry to get
   */ get(key) {
        const result = this._cache.get(key);
        if (!result) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`[Assets] Asset id ${key} was not found in the Cache`);
        }
        return result;
    }
    /**
   * Set a value by key or keys name
   * @param key - The key or keys to set
   * @param value - The value to store in the cache or from which cacheable assets will be derived.
   */ set(key, value) {
        const keys = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["convertToList"])(key);
        let cacheableAssets;
        for(let i = 0; i < this.parsers.length; i++){
            const parser = this.parsers[i];
            if (parser.test(value)) {
                cacheableAssets = parser.getCacheableAssets(keys, value);
                break;
            }
        }
        const cacheableMap = new Map(Object.entries(cacheableAssets || {}));
        if (!cacheableAssets) {
            keys.forEach((key2)=>{
                cacheableMap.set(key2, value);
            });
        }
        const cacheKeys = [
            ...cacheableMap.keys()
        ];
        const cachedAssets = {
            cacheKeys,
            keys
        };
        keys.forEach((key2)=>{
            this._cacheMap.set(key2, cachedAssets);
        });
        cacheKeys.forEach((key2)=>{
            const val = cacheableAssets ? cacheableAssets[key2] : value;
            if (this._cache.has(key2) && this._cache.get(key2) !== val) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("[Cache] already has key:", key2);
            }
            this._cache.set(key2, cacheableMap.get(key2));
        });
    }
    /**
   * Remove entry by key
   *
   * This function will also remove any associated alias from the cache also.
   * @param key - The key of the entry to remove
   */ remove(key) {
        if (!this._cacheMap.has(key)) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`[Assets] Asset id ${key} was not found in the Cache`);
            return;
        }
        const cacheMap = this._cacheMap.get(key);
        const cacheKeys = cacheMap.cacheKeys;
        cacheKeys.forEach((key2)=>{
            this._cache.delete(key2);
        });
        cacheMap.keys.forEach((key2)=>{
            this._cacheMap.delete(key2);
        });
    }
    /**
   * All loader parsers registered
   * @advanced
   */ get parsers() {
        return this._parsers;
    }
}
const Cache = new CacheClass();
;
 //# sourceMappingURL=Cache.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/LoaderParser.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LoaderParserPriority",
    ()=>LoaderParserPriority
]);
"use strict";
var LoaderParserPriority = /* @__PURE__ */ ((LoaderParserPriority2)=>{
    LoaderParserPriority2[LoaderParserPriority2["Low"] = 0] = "Low";
    LoaderParserPriority2[LoaderParserPriority2["Normal"] = 1] = "Normal";
    LoaderParserPriority2[LoaderParserPriority2["High"] = 2] = "High";
    return LoaderParserPriority2;
})(LoaderParserPriority || {});
;
 //# sourceMappingURL=LoaderParser.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/createStringVariations.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createStringVariations",
    ()=>createStringVariations
]);
"use strict";
function processX(base, ids, depth, result, tags) {
    const id = ids[depth];
    for(let i = 0; i < id.length; i++){
        const value = id[i];
        if (depth < ids.length - 1) {
            processX(base.replace(result[depth], value), ids, depth + 1, result, tags);
        } else {
            tags.push(base.replace(result[depth], value));
        }
    }
}
function createStringVariations(string) {
    const regex = /\{(.*?)\}/g;
    const result = string.match(regex);
    const tags = [];
    if (result) {
        const ids = [];
        result.forEach((vars)=>{
            const split = vars.substring(1, vars.length - 1).split(",");
            ids.push(split);
        });
        processX(string, ids, 0, result, tags);
    } else {
        tags.push(string);
    }
    return tags;
}
;
 //# sourceMappingURL=createStringVariations.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/isSingleItem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isSingleItem",
    ()=>isSingleItem
]);
"use strict";
const isSingleItem = (item)=>!Array.isArray(item);
;
 //# sourceMappingURL=isSingleItem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/resolver/Resolver.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Resolver",
    ()=>Resolver,
    "getUrlExtension",
    ()=>getUrlExtension
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/path.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/convertToList.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$createStringVariations$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/createStringVariations.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$isSingleItem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/isSingleItem.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
"use strict";
class Resolver {
    constructor(){
        this._defaultBundleIdentifierOptions = {
            connector: "-",
            createBundleAssetId: (bundleId, assetId)=>`${bundleId}${this._bundleIdConnector}${assetId}`,
            extractAssetIdFromBundle: (bundleId, assetBundleId)=>assetBundleId.replace(`${bundleId}${this._bundleIdConnector}`, "")
        };
        /** The character that is used to connect the bundleId and the assetId when generating a bundle asset id key */ this._bundleIdConnector = this._defaultBundleIdentifierOptions.connector;
        /**
     * A function that generates a bundle asset id key from a bundleId and an assetId
     * @param bundleId - the bundleId
     * @param assetId  - the assetId
     * @returns the bundle asset id key
     */ this._createBundleAssetId = this._defaultBundleIdentifierOptions.createBundleAssetId;
        /**
     * A function that generates an assetId from a bundle asset id key. This is the reverse of generateBundleAssetId
     * @param bundleId - the bundleId
     * @param assetBundleId - the bundle asset id key
     * @returns the assetId
     */ this._extractAssetIdFromBundle = this._defaultBundleIdentifierOptions.extractAssetIdFromBundle;
        this._assetMap = {};
        this._preferredOrder = [];
        this._parsers = [];
        this._resolverHash = {};
        this._bundles = {};
    }
    /**
   * Override how the resolver deals with generating bundle ids.
   * must be called before any bundles are added
   * @param bundleIdentifier - the bundle identifier options
   */ setBundleIdentifier(bundleIdentifier) {
        this._bundleIdConnector = bundleIdentifier.connector ?? this._bundleIdConnector;
        this._createBundleAssetId = bundleIdentifier.createBundleAssetId ?? this._createBundleAssetId;
        this._extractAssetIdFromBundle = bundleIdentifier.extractAssetIdFromBundle ?? this._extractAssetIdFromBundle;
        if (this._extractAssetIdFromBundle("foo", this._createBundleAssetId("foo", "bar")) !== "bar") {
            throw new Error("[Resolver] GenerateBundleAssetId are not working correctly");
        }
    }
    /**
   * Let the resolver know which assets you prefer to use when resolving assets.
   * Multiple prefer user defined rules can be added.
   * @example
   * resolver.prefer({
   *     // first look for something with the correct format, and then then correct resolution
   *     priority: ['format', 'resolution'],
   *     params:{
   *         format:'webp', // prefer webp images
   *         resolution: 2, // prefer a resolution of 2
   *     }
   * })
   * resolver.add('foo', ['bar@2x.webp', 'bar@2x.png', 'bar.webp', 'bar.png']);
   * resolver.resolveUrl('foo') // => 'bar@2x.webp'
   * @param preferOrders - the prefer options
   */ prefer(...preferOrders) {
        preferOrders.forEach((prefer)=>{
            this._preferredOrder.push(prefer);
            if (!prefer.priority) {
                prefer.priority = Object.keys(prefer.params);
            }
        });
        this._resolverHash = {};
    }
    /**
   * Set the base path to prepend to all urls when resolving
   * @example
   * resolver.basePath = 'https://home.com/';
   * resolver.add('foo', 'bar.ong');
   * resolver.resolveUrl('foo', 'bar.png'); // => 'https://home.com/bar.png'
   * @param basePath - the base path to use
   */ set basePath(basePath) {
        this._basePath = basePath;
    }
    get basePath() {
        return this._basePath;
    }
    /**
   * Set the root path for root-relative URLs. By default the `basePath`'s root is used. If no `basePath` is set, then the
   * default value for browsers is `window.location.origin`
   * @example
   * // Application hosted on https://home.com/some-path/index.html
   * resolver.basePath = 'https://home.com/some-path/';
   * resolver.rootPath = 'https://home.com/';
   * resolver.add('foo', '/bar.png');
   * resolver.resolveUrl('foo', '/bar.png'); // => 'https://home.com/bar.png'
   * @param rootPath - the root path to use
   */ set rootPath(rootPath) {
        this._rootPath = rootPath;
    }
    get rootPath() {
        return this._rootPath;
    }
    /**
   * All the active URL parsers that help the parser to extract information and create
   * an asset object-based on parsing the URL itself.
   *
   * Can be added using the extensions API
   * @example
   * resolver.add('foo', [
   *     {
   *         resolution: 2,
   *         format: 'png',
   *         src: 'image@2x.png',
   *     },
   *     {
   *         resolution:1,
   *         format:'png',
   *         src: 'image.png',
   *     },
   * ]);
   *
   * // With a url parser the information such as resolution and file format could extracted from the url itself:
   * extensions.add({
   *     extension: ExtensionType.ResolveParser,
   *     test: loadTextures.test, // test if url ends in an image
   *     parse: (value: string) =>
   *     ({
   *         resolution: parseFloat(Resolver.RETINA_PREFIX.exec(value)?.[1] ?? '1'),
   *         format: value.split('.').pop(),
   *         src: value,
   *     }),
   * });
   *
   * // Now resolution and format can be extracted from the url
   * resolver.add('foo', [
   *     'image@2x.png',
   *     'image.png',
   * ]);
   */ get parsers() {
        return this._parsers;
    }
    /** Used for testing, this resets the resolver to its initial state */ reset() {
        this.setBundleIdentifier(this._defaultBundleIdentifierOptions);
        this._assetMap = {};
        this._preferredOrder = [];
        this._resolverHash = {};
        this._rootPath = null;
        this._basePath = null;
        this._manifest = null;
        this._bundles = {};
        this._defaultSearchParams = null;
    }
    /**
   * Sets the default URL search parameters for the URL resolver. The urls can be specified as a string or an object.
   * @param searchParams - the default url parameters to append when resolving urls
   */ setDefaultSearchParams(searchParams) {
        if (typeof searchParams === "string") {
            this._defaultSearchParams = searchParams;
        } else {
            const queryValues = searchParams;
            this._defaultSearchParams = Object.keys(queryValues).map((key)=>`${encodeURIComponent(key)}=${encodeURIComponent(queryValues[key])}`).join("&");
        }
    }
    /**
   * Returns the aliases for a given asset
   * @param asset - the asset to get the aliases for
   */ getAlias(asset) {
        const { alias, src } = asset;
        const aliasesToUse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["convertToList"])(alias || src, (value)=>{
            if (typeof value === "string") return value;
            if (Array.isArray(value)) return value.map((v)=>v?.src ?? v);
            if (value?.src) return value.src;
            return value;
        }, true);
        return aliasesToUse;
    }
    /**
   * Add a manifest to the asset resolver. This is a nice way to add all the asset information in one go.
   * generally a manifest would be built using a tool.
   * @param manifest - the manifest to add to the resolver
   */ addManifest(manifest) {
        if (this._manifest) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("[Resolver] Manifest already exists, this will be overwritten");
        }
        this._manifest = manifest;
        manifest.bundles.forEach((bundle)=>{
            this.addBundle(bundle.name, bundle.assets);
        });
    }
    /**
   * This adds a bundle of assets in one go so that you can resolve them as a group.
   * For example you could add a bundle for each screen in you pixi app
   * @example
   * resolver.addBundle('animals', [
   *  { alias: 'bunny', src: 'bunny.png' },
   *  { alias: 'chicken', src: 'chicken.png' },
   *  { alias: 'thumper', src: 'thumper.png' },
   * ]);
   * // or
   * resolver.addBundle('animals', {
   *     bunny: 'bunny.png',
   *     chicken: 'chicken.png',
   *     thumper: 'thumper.png',
   * });
   *
   * const resolvedAssets = await resolver.resolveBundle('animals');
   * @param bundleId - The id of the bundle to add
   * @param assets - A record of the asset or assets that will be chosen from when loading via the specified key
   */ addBundle(bundleId, assets) {
        const assetNames = [];
        let convertedAssets = assets;
        if (!Array.isArray(assets)) {
            convertedAssets = Object.entries(assets).map(([alias, src])=>{
                if (typeof src === "string" || Array.isArray(src)) {
                    return {
                        alias,
                        src
                    };
                }
                return {
                    alias,
                    ...src
                };
            });
        }
        convertedAssets.forEach((asset)=>{
            const srcs = asset.src;
            const aliases = asset.alias;
            let ids;
            if (typeof aliases === "string") {
                const bundleAssetId = this._createBundleAssetId(bundleId, aliases);
                assetNames.push(bundleAssetId);
                ids = [
                    aliases,
                    bundleAssetId
                ];
            } else {
                const bundleIds = aliases.map((name)=>this._createBundleAssetId(bundleId, name));
                assetNames.push(...bundleIds);
                ids = [
                    ...aliases,
                    ...bundleIds
                ];
            }
            this.add({
                ...asset,
                ...{
                    alias: ids,
                    src: srcs
                }
            });
        });
        this._bundles[bundleId] = assetNames;
    }
    /**
   * Tells the resolver what keys are associated with witch asset.
   * The most important thing the resolver does
   * @example
   * // Single key, single asset:
   * resolver.add({alias: 'foo', src: 'bar.png');
   * resolver.resolveUrl('foo') // => 'bar.png'
   *
   * // Multiple keys, single asset:
   * resolver.add({alias: ['foo', 'boo'], src: 'bar.png'});
   * resolver.resolveUrl('foo') // => 'bar.png'
   * resolver.resolveUrl('boo') // => 'bar.png'
   *
   * // Multiple keys, multiple assets:
   * resolver.add({alias: ['foo', 'boo'], src: ['bar.png', 'bar.webp']});
   * resolver.resolveUrl('foo') // => 'bar.png'
   *
   * // Add custom data attached to the resolver
   * Resolver.add({
   *     alias: 'bunnyBooBooSmooth',
   *     src: 'bunny{png,webp}',
   *     data: { scaleMode:SCALE_MODES.NEAREST }, // Base texture options
   * });
   *
   * resolver.resolve('bunnyBooBooSmooth') // => { src: 'bunny.png', data: { scaleMode: SCALE_MODES.NEAREST } }
   * @param aliases - the UnresolvedAsset or array of UnresolvedAssets to add to the resolver
   */ add(aliases) {
        const assets = [];
        if (Array.isArray(aliases)) {
            assets.push(...aliases);
        } else {
            assets.push(aliases);
        }
        let keyCheck;
        keyCheck = (key)=>{
            if (this.hasKey(key)) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`[Resolver] already has key: ${key} overwriting`);
            }
        };
        const assetArray = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["convertToList"])(assets);
        assetArray.forEach((asset)=>{
            const { src } = asset;
            let { data, format, loadParser: userDefinedLoadParser, parser: userDefinedParser } = asset;
            const srcsToUse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["convertToList"])(src).map((src2)=>{
                if (typeof src2 === "string") {
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$createStringVariations$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createStringVariations"])(src2);
                }
                return Array.isArray(src2) ? src2 : [
                    src2
                ];
            });
            const aliasesToUse = this.getAlias(asset);
            Array.isArray(aliasesToUse) ? aliasesToUse.forEach(keyCheck) : keyCheck(aliasesToUse);
            const resolvedAssets = [];
            srcsToUse.forEach((srcs)=>{
                srcs.forEach((src2)=>{
                    let formattedAsset = {};
                    if (typeof src2 !== "object") {
                        formattedAsset.src = src2;
                        for(let i = 0; i < this._parsers.length; i++){
                            const parser = this._parsers[i];
                            if (parser.test(src2)) {
                                formattedAsset = parser.parse(src2);
                                break;
                            }
                        }
                    } else {
                        data = src2.data ?? data;
                        format = src2.format ?? format;
                        if (src2.loadParser || src2.parser) {
                            userDefinedLoadParser = src2.loadParser ?? userDefinedLoadParser;
                            userDefinedParser = src2.parser ?? userDefinedParser;
                        }
                        formattedAsset = {
                            ...formattedAsset,
                            ...src2
                        };
                    }
                    if (!aliasesToUse) {
                        throw new Error(`[Resolver] alias is undefined for this asset: ${formattedAsset.src}`);
                    }
                    formattedAsset = this._buildResolvedAsset(formattedAsset, {
                        aliases: aliasesToUse,
                        data,
                        format,
                        loadParser: userDefinedLoadParser,
                        parser: userDefinedParser
                    });
                    resolvedAssets.push(formattedAsset);
                });
            });
            aliasesToUse.forEach((alias)=>{
                this._assetMap[alias] = resolvedAssets;
            });
        });
    }
    // TODO: this needs an overload like load did in Assets
    /**
   * If the resolver has had a manifest set via setManifest, this will return the assets urls for
   * a given bundleId or bundleIds.
   * @example
   * // Manifest Example
   * const manifest = {
   *     bundles: [
   *         {
   *             name: 'load-screen',
   *             assets: [
   *                 {
   *                     alias: 'background',
   *                     src: 'sunset.png',
   *                 },
   *                 {
   *                     alias: 'bar',
   *                     src: 'load-bar.{png,webp}',
   *                 },
   *             ],
   *         },
   *         {
   *             name: 'game-screen',
   *             assets: [
   *                 {
   *                     alias: 'character',
   *                     src: 'robot.png',
   *                 },
   *                 {
   *                     alias: 'enemy',
   *                     src: 'bad-guy.png',
   *                 },
   *             ],
   *         },
   *     ]
   * };
   *
   * resolver.setManifest(manifest);
   * const resolved = resolver.resolveBundle('load-screen');
   * @param bundleIds - The bundle ids to resolve
   * @returns All the bundles assets or a hash of assets for each bundle specified
   */ resolveBundle(bundleIds) {
        const singleAsset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$isSingleItem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isSingleItem"])(bundleIds);
        bundleIds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["convertToList"])(bundleIds);
        const out = {};
        bundleIds.forEach((bundleId)=>{
            const assetNames = this._bundles[bundleId];
            if (assetNames) {
                const results = this.resolve(assetNames);
                const assets = {};
                for(const key in results){
                    const asset = results[key];
                    assets[this._extractAssetIdFromBundle(bundleId, key)] = asset;
                }
                out[bundleId] = assets;
            }
        });
        return singleAsset ? out[bundleIds[0]] : out;
    }
    /**
   * Does exactly what resolve does, but returns just the URL rather than the whole asset object
   * @param key - The key or keys to resolve
   * @returns - The URLs associated with the key(s)
   */ resolveUrl(key) {
        const result = this.resolve(key);
        if (typeof key !== "string") {
            const out = {};
            for(const i in result){
                out[i] = result[i].src;
            }
            return out;
        }
        return result.src;
    }
    resolve(keys) {
        const singleAsset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$isSingleItem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isSingleItem"])(keys);
        keys = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["convertToList"])(keys);
        const result = {};
        keys.forEach((key)=>{
            if (!this._resolverHash[key]) {
                if (this._assetMap[key]) {
                    let assets = this._assetMap[key];
                    const preferredOrder = this._getPreferredOrder(assets);
                    preferredOrder?.priority.forEach((priorityKey)=>{
                        preferredOrder.params[priorityKey].forEach((value)=>{
                            const filteredAssets = assets.filter((asset)=>{
                                if (asset[priorityKey]) {
                                    return asset[priorityKey] === value;
                                }
                                return false;
                            });
                            if (filteredAssets.length) {
                                assets = filteredAssets;
                            }
                        });
                    });
                    this._resolverHash[key] = assets[0];
                } else {
                    this._resolverHash[key] = this._buildResolvedAsset({
                        alias: [
                            key
                        ],
                        src: key
                    }, {});
                }
            }
            result[key] = this._resolverHash[key];
        });
        return singleAsset ? result[keys[0]] : result;
    }
    /**
   * Checks if an asset with a given key exists in the resolver
   * @param key - The key of the asset
   */ hasKey(key) {
        return !!this._assetMap[key];
    }
    /**
   * Checks if a bundle with the given key exists in the resolver
   * @param key - The key of the bundle
   */ hasBundle(key) {
        return !!this._bundles[key];
    }
    /**
   * Internal function for figuring out what prefer criteria an asset should use.
   * @param assets
   */ _getPreferredOrder(assets) {
        for(let i = 0; i < assets.length; i++){
            const asset = assets[i];
            const preferred = this._preferredOrder.find((preference)=>preference.params.format.includes(asset.format));
            if (preferred) {
                return preferred;
            }
        }
        return this._preferredOrder[0];
    }
    /**
   * Appends the default url parameters to the url
   * @param url - The url to append the default parameters to
   * @returns - The url with the default parameters appended
   */ _appendDefaultSearchParams(url) {
        if (!this._defaultSearchParams) return url;
        const paramConnector = /\?/.test(url) ? "&" : "?";
        return `${url}${paramConnector}${this._defaultSearchParams}`;
    }
    _buildResolvedAsset(formattedAsset, data) {
        const { aliases, data: assetData, loadParser, parser, format } = data;
        if (this._basePath || this._rootPath) {
            formattedAsset.src = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["path"].toAbsolute(formattedAsset.src, this._basePath, this._rootPath);
        }
        formattedAsset.alias = aliases ?? formattedAsset.alias ?? [
            formattedAsset.src
        ];
        formattedAsset.src = this._appendDefaultSearchParams(formattedAsset.src);
        formattedAsset.data = {
            ...assetData || {},
            ...formattedAsset.data
        };
        formattedAsset.loadParser = loadParser ?? formattedAsset.loadParser;
        formattedAsset.parser = parser ?? formattedAsset.parser;
        formattedAsset.format = format ?? formattedAsset.format ?? getUrlExtension(formattedAsset.src);
        return formattedAsset;
    }
}
/**
 * The prefix that denotes a URL is for a retina asset.
 * @default /@([0-9\.]+)x/
 * @example `@2x`
 */ Resolver.RETINA_PREFIX = /@([0-9\.]+)x/;
function getUrlExtension(url) {
    return url.split(".").pop().split("?").shift().split("#").shift();
}
;
 //# sourceMappingURL=Resolver.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/copySearchParams.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "copySearchParams",
    ()=>copySearchParams
]);
"use strict";
const copySearchParams = (targetUrl, sourceUrl)=>{
    const searchParams = sourceUrl.split("?")[1];
    if (searchParams) {
        targetUrl += `?${searchParams}`;
    }
    return targetUrl;
};
;
 //# sourceMappingURL=copySearchParams.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/BackgroundLoader.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BackgroundLoader",
    ()=>BackgroundLoader
]);
"use strict";
class BackgroundLoader {
    /**
   * @param loader
   * @param verbose - should the loader log to the console
   */ constructor(loader, verbose = false){
        this._loader = loader;
        this._assetList = [];
        this._isLoading = false;
        this._maxConcurrent = 1;
        this.verbose = verbose;
    }
    /**
   * Adds assets to the background loading queue. Assets are loaded one at a time to minimize
   * performance impact.
   * @param assetUrls - Array of resolved assets to load in the background
   * @example
   * ```ts
   * // Add assets to background load queue
   * backgroundLoader.add([
   *     { src: 'images/level1/bg.png' },
   *     { src: 'images/level1/characters.json' }
   * ]);
   *
   * // Assets will load sequentially in the background
   * // The loader automatically pauses when high-priority loads occur
   * // e.g. Assets.load() is called
   * ```
   * @remarks
   * - Assets are loaded one at a time to minimize performance impact
   * - Loading automatically pauses when Assets.load() is called
   * - No progress tracking is available for background loading
   * - Assets are cached as they complete loading
   * @internal
   */ add(assetUrls) {
        assetUrls.forEach((a)=>{
            this._assetList.push(a);
        });
        if (this.verbose) {
            console.log("[BackgroundLoader] assets: ", this._assetList);
        }
        if (this._isActive && !this._isLoading) {
            void this._next();
        }
    }
    /**
   * Loads the next set of assets. Will try to load as many assets as it can at the same time.
   *
   * The max assets it will try to load at one time will be 4.
   */ async _next() {
        if (this._assetList.length && this._isActive) {
            this._isLoading = true;
            const toLoad = [];
            const toLoadAmount = Math.min(this._assetList.length, this._maxConcurrent);
            for(let i = 0; i < toLoadAmount; i++){
                toLoad.push(this._assetList.pop());
            }
            await this._loader.load(toLoad);
            this._isLoading = false;
            void this._next();
        }
    }
    /**
   * Controls the active state of the background loader. When active, the loader will
   * continue processing its queue. When inactive, loading is paused.
   * @returns Whether the background loader is currently active
   * @example
   * ```ts
   * // Pause background loading
   * backgroundLoader.active = false;
   *
   * // Resume background loading
   * backgroundLoader.active = true;
   *
   * // Check current state
   * console.log(backgroundLoader.active); // true/false
   *
   * // Common use case: Pause during intensive operations
   * backgroundLoader.active = false;  // Pause background loading
   * ... // Perform high-priority tasks
   * backgroundLoader.active = true;   // Resume background loading
   * ```
   * @remarks
   * - Setting to true resumes loading immediately
   * - Setting to false pauses after current asset completes
   * - Background loading is automatically paused during `Assets.load()`
   * - Assets already being loaded will complete even when set to false
   */ get active() {
        return this._isActive;
    }
    set active(value) {
        if (this._isActive === value) return;
        this._isActive = value;
        if (value && !this._isLoading) {
            void this._next();
        }
    }
}
;
 //# sourceMappingURL=BackgroundLoader.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/cache/parsers/cacheTextureArray.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cacheTextureArray",
    ()=>cacheTextureArray
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
const cacheTextureArray = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CacheParser,
        name: "cacheTextureArray"
    },
    test: (asset)=>Array.isArray(asset) && asset.every((t)=>t instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]),
    getCacheableAssets: (keys, asset)=>{
        const out = {};
        keys.forEach((key)=>{
            asset.forEach((item, i)=>{
                out[key + (i === 0 ? "" : i + 1)] = item;
            });
        });
        return out;
    }
};
;
 //# sourceMappingURL=cacheTextureArray.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/utils/testImageFormat.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "testImageFormat",
    ()=>testImageFormat
]);
"use strict";
async function testImageFormat(imageData) {
    if ("Image" in globalThis) {
        return new Promise((resolve)=>{
            const image = new Image();
            image.onload = ()=>{
                resolve(true);
            };
            image.onerror = ()=>{
                resolve(false);
            };
            image.src = imageData;
        });
    }
    if ("createImageBitmap" in globalThis && "fetch" in globalThis) {
        try {
            const blob = await (await fetch(imageData)).blob();
            await createImageBitmap(blob);
        } catch (_e) {
            return false;
        }
        return true;
    }
    return false;
}
;
 //# sourceMappingURL=testImageFormat.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectAvif.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectAvif",
    ()=>detectAvif
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testImageFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/utils/testImageFormat.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
const detectAvif = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].DetectionParser,
        priority: 1
    },
    test: async ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testImageFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["testImageFormat"])(// eslint-disable-next-line max-len
        "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="),
    add: async (formats)=>[
            ...formats,
            "avif"
        ],
    remove: async (formats)=>formats.filter((f)=>f !== "avif")
};
;
 //# sourceMappingURL=detectAvif.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectDefaults.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectDefaults",
    ()=>detectDefaults
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
const imageFormats = [
    "png",
    "jpg",
    "jpeg"
];
const detectDefaults = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].DetectionParser,
        priority: -1
    },
    test: ()=>Promise.resolve(true),
    add: async (formats)=>[
            ...formats,
            ...imageFormats
        ],
    remove: async (formats)=>formats.filter((f)=>!imageFormats.includes(f))
};
;
 //# sourceMappingURL=detectDefaults.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/utils/testVideoFormat.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "testVideoFormat",
    ()=>testVideoFormat
]);
"use strict";
const inWorker = "WorkerGlobalScope" in globalThis && globalThis instanceof globalThis.WorkerGlobalScope;
function testVideoFormat(mimeType) {
    if (inWorker) {
        return false;
    }
    const video = document.createElement("video");
    return video.canPlayType(mimeType) !== "";
}
;
 //# sourceMappingURL=testVideoFormat.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectMp4.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectMp4",
    ()=>detectMp4
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testVideoFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/utils/testVideoFormat.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
const detectMp4 = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].DetectionParser,
        priority: 0
    },
    test: async ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testVideoFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["testVideoFormat"])("video/mp4"),
    add: async (formats)=>[
            ...formats,
            "mp4",
            "m4v"
        ],
    remove: async (formats)=>formats.filter((f)=>f !== "mp4" && f !== "m4v")
};
;
 //# sourceMappingURL=detectMp4.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectOgv.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectOgv",
    ()=>detectOgv
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testVideoFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/utils/testVideoFormat.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
const detectOgv = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].DetectionParser,
        priority: 0
    },
    test: async ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testVideoFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["testVideoFormat"])("video/ogg"),
    add: async (formats)=>[
            ...formats,
            "ogv"
        ],
    remove: async (formats)=>formats.filter((f)=>f !== "ogv")
};
;
 //# sourceMappingURL=detectOgv.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectWebm.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectWebm",
    ()=>detectWebm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testVideoFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/utils/testVideoFormat.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
const detectWebm = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].DetectionParser,
        priority: 0
    },
    test: async ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testVideoFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["testVideoFormat"])("video/webm"),
    add: async (formats)=>[
            ...formats,
            "webm"
        ],
    remove: async (formats)=>formats.filter((f)=>f !== "webm")
};
;
 //# sourceMappingURL=detectWebm.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectWebp.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectWebp",
    ()=>detectWebp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testImageFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/utils/testImageFormat.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
const detectWebp = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].DetectionParser,
        priority: 0
    },
    test: async ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testImageFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["testImageFormat"])("data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA="),
    add: async (formats)=>[
            ...formats,
            "webp"
        ],
    remove: async (formats)=>formats.filter((f)=>f !== "webp")
};
;
 //# sourceMappingURL=detectWebp.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/Loader.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Loader",
    ()=>Loader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/path.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/convertToList.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$isSingleItem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/isSingleItem.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
class Loader {
    constructor(){
        this._parsers = [];
        this._parsersValidated = false;
        /**
     * All loader parsers registered
     * @type {assets.LoaderParser[]}
     */ this.parsers = new Proxy(this._parsers, {
            set: (target, key, value)=>{
                this._parsersValidated = false;
                target[key] = value;
                return true;
            }
        });
        /** Cache loading promises that ae currently active */ this.promiseCache = {};
    }
    /** function used for testing */ reset() {
        this._parsersValidated = false;
        this.promiseCache = {};
    }
    /**
   * Used internally to generate a promise for the asset to be loaded.
   * @param url - The URL to be loaded
   * @param data - any custom additional information relevant to the asset being loaded
   * @returns - a promise that will resolve to an Asset for example a Texture of a JSON object
   */ _getLoadPromiseAndParser(url, data) {
        const result = {
            promise: null,
            parser: null
        };
        result.promise = (async ()=>{
            let asset = null;
            let parser = null;
            if (data.parser || data.loadParser) {
                parser = this._parserHash[data.parser || data.loadParser];
                if (data.loadParser) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`[Assets] "loadParser" is deprecated, use "parser" instead for ${url}`);
                }
                if (!parser) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`[Assets] specified load parser "${data.parser || data.loadParser}" not found while loading ${url}`);
                }
            }
            if (!parser) {
                for(let i = 0; i < this.parsers.length; i++){
                    const parserX = this.parsers[i];
                    if (parserX.load && parserX.test?.(url, data, this)) {
                        parser = parserX;
                        break;
                    }
                }
                if (!parser) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`[Assets] ${url} could not be loaded as we don't know how to parse it, ensure the correct parser has been added`);
                    return null;
                }
            }
            asset = await parser.load(url, data, this);
            result.parser = parser;
            for(let i = 0; i < this.parsers.length; i++){
                const parser2 = this.parsers[i];
                if (parser2.parse) {
                    if (parser2.parse && await parser2.testParse?.(asset, data, this)) {
                        asset = await parser2.parse(asset, data, this) || asset;
                        result.parser = parser2;
                    }
                }
            }
            return asset;
        })();
        return result;
    }
    async load(assetsToLoadIn, onProgress) {
        if (!this._parsersValidated) {
            this._validateParsers();
        }
        let count = 0;
        const assets = {};
        const singleAsset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$isSingleItem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isSingleItem"])(assetsToLoadIn);
        const assetsToLoad = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["convertToList"])(assetsToLoadIn, (item)=>({
                alias: [
                    item
                ],
                src: item,
                data: {}
            }));
        const total = assetsToLoad.length;
        const promises = assetsToLoad.map(async (asset)=>{
            const url = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["path"].toAbsolute(asset.src);
            if (!assets[asset.src]) {
                try {
                    if (!this.promiseCache[url]) {
                        this.promiseCache[url] = this._getLoadPromiseAndParser(url, asset);
                    }
                    assets[asset.src] = await this.promiseCache[url].promise;
                    if (onProgress) onProgress(++count / total);
                } catch (e) {
                    delete this.promiseCache[url];
                    delete assets[asset.src];
                    throw new Error(`[Loader.load] Failed to load ${url}.
${e}`);
                }
            }
        });
        await Promise.all(promises);
        return singleAsset ? assets[assetsToLoad[0].src] : assets;
    }
    /**
   * Unloads one or more assets. Any unloaded assets will be destroyed, freeing up memory for your app.
   * The parser that created the asset, will be the one that unloads it.
   * @example
   * // Single asset:
   * const asset = await Loader.load('cool.png');
   *
   * await Loader.unload('cool.png');
   *
   * console.log(asset.destroyed); // true
   * @param assetsToUnloadIn - urls that you want to unload, or a single one!
   */ async unload(assetsToUnloadIn) {
        const assetsToUnload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["convertToList"])(assetsToUnloadIn, (item)=>({
                alias: [
                    item
                ],
                src: item
            }));
        const promises = assetsToUnload.map(async (asset)=>{
            const url = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["path"].toAbsolute(asset.src);
            const loadPromise = this.promiseCache[url];
            if (loadPromise) {
                const loadedAsset = await loadPromise.promise;
                delete this.promiseCache[url];
                await loadPromise.parser?.unload?.(loadedAsset, asset, this);
            }
        });
        await Promise.all(promises);
    }
    /** validates our parsers, right now it only checks for name conflicts but we can add more here as required! */ _validateParsers() {
        this._parsersValidated = true;
        this._parserHash = this._parsers.filter((parser)=>parser.name || parser.id).reduce((hash, parser)=>{
            if (!parser.name && !parser.id) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`[Assets] parser should have an id`);
            } else if (hash[parser.name] || hash[parser.id]) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`[Assets] parser id conflict "${parser.id}"`);
            }
            hash[parser.name] = parser;
            if (parser.id) hash[parser.id] = parser;
            return hash;
        }, {});
    }
}
;
 //# sourceMappingURL=Loader.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkDataUrl.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkDataUrl",
    ()=>checkDataUrl
]);
"use strict";
function checkDataUrl(url, mimes) {
    if (Array.isArray(mimes)) {
        for (const mime of mimes){
            if (url.startsWith(`data:${mime}`)) return true;
        }
        return false;
    }
    return url.startsWith(`data:${mimes}`);
}
;
 //# sourceMappingURL=checkDataUrl.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkExtension.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkExtension",
    ()=>checkExtension
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/path.mjs [app-ssr] (ecmascript)");
;
"use strict";
function checkExtension(url, extension) {
    const tempURL = url.split("?")[0];
    const ext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["path"].extname(tempURL).toLowerCase();
    if (Array.isArray(extension)) {
        return extension.includes(ext);
    }
    return ext === extension;
}
;
 //# sourceMappingURL=checkExtension.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/loadJson.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadJson",
    ()=>loadJson
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkDataUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkExtension.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/LoaderParser.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
"use strict";
const validJSONExtension = ".json";
const validJSONMIME = "application/json";
const loadJson = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].LoadParser,
        priority: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LoaderParserPriority"].Low
    },
    /** used for deprecation purposes */ name: "loadJson",
    id: "json",
    test (url) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkDataUrl"])(url, validJSONMIME) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkExtension"])(url, validJSONExtension);
    },
    async load (url) {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().fetch(url);
        const json = await response.json();
        return json;
    }
};
;
 //# sourceMappingURL=loadJson.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/loadTxt.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadTxt",
    ()=>loadTxt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkDataUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkExtension.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/LoaderParser.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
"use strict";
const validTXTExtension = ".txt";
const validTXTMIME = "text/plain";
const loadTxt = {
    /** used for deprecation purposes */ name: "loadTxt",
    id: "text",
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].LoadParser,
        priority: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LoaderParserPriority"].Low,
        name: "loadTxt"
    },
    test (url) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkDataUrl"])(url, validTXTMIME) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkExtension"])(url, validTXTExtension);
    },
    async load (url) {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().fetch(url);
        const txt = await response.text();
        return txt;
    }
};
;
 //# sourceMappingURL=loadTxt.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/loadWebFont.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getFontFamilyName",
    ()=>getFontFamilyName,
    "loadWebFont",
    ()=>loadWebFont
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/path.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/cache/Cache.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkDataUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkExtension.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/LoaderParser.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
"use strict";
const validWeights = [
    "normal",
    "bold",
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
];
const validFontExtensions = [
    ".ttf",
    ".otf",
    ".woff",
    ".woff2"
];
const validFontMIMEs = [
    "font/ttf",
    "font/otf",
    "font/woff",
    "font/woff2"
];
const CSS_IDENT_TOKEN_REGEX = /^(--|-?[A-Z_])[0-9A-Z_-]*$/i;
function getFontFamilyName(url) {
    const ext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["path"].extname(url);
    const name = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["path"].basename(url, ext);
    const nameWithSpaces = name.replace(/(-|_)/g, " ");
    const nameTokens = nameWithSpaces.toLowerCase().split(" ").map((word)=>word.charAt(0).toUpperCase() + word.slice(1));
    let valid = nameTokens.length > 0;
    for (const token of nameTokens){
        if (!token.match(CSS_IDENT_TOKEN_REGEX)) {
            valid = false;
            break;
        }
    }
    let fontFamilyName = nameTokens.join(" ");
    if (!valid) {
        fontFamilyName = `"${fontFamilyName.replace(/[\\"]/g, "\\$&")}"`;
    }
    return fontFamilyName;
}
const validURICharactersRegex = /^[0-9A-Za-z%:/?#\[\]@!\$&'()\*\+,;=\-._~]*$/;
function encodeURIWhenNeeded(uri) {
    if (validURICharactersRegex.test(uri)) {
        return uri;
    }
    return encodeURI(uri);
}
const loadWebFont = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].LoadParser,
        priority: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LoaderParserPriority"].Low
    },
    /** used for deprecation purposes */ name: "loadWebFont",
    id: "web-font",
    test (url) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkDataUrl"])(url, validFontMIMEs) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkExtension"])(url, validFontExtensions);
    },
    async load (url, options) {
        const fonts = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getFontFaceSet();
        if (fonts) {
            const fontFaces = [];
            const name = options.data?.family ?? getFontFamilyName(url);
            const weights = options.data?.weights?.filter((weight)=>validWeights.includes(weight)) ?? [
                "normal"
            ];
            const data = options.data ?? {};
            for(let i = 0; i < weights.length; i++){
                const weight = weights[i];
                const font = new FontFace(name, `url(${encodeURIWhenNeeded(url)})`, {
                    ...data,
                    weight
                });
                await font.load();
                fonts.add(font);
                fontFaces.push(font);
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].has(`${name}-and-url`)) {
                const cached = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].get(`${name}-and-url`);
                cached.entries.push({
                    url,
                    faces: fontFaces
                });
            } else {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].set(`${name}-and-url`, {
                    entries: [
                        {
                            url,
                            faces: fontFaces
                        }
                    ]
                });
            }
            return fontFaces.length === 1 ? fontFaces[0] : fontFaces;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("[loadWebFont] FontFace API is not supported. Skipping loading font");
        return null;
    },
    unload (font) {
        const fonts = Array.isArray(font) ? font : [
            font
        ];
        const fontFamily = fonts[0].family;
        const cached = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].get(`${fontFamily}-and-url`);
        const entry = cached.entries.find((f)=>f.faces.some((t)=>fonts.indexOf(t) !== -1));
        entry.faces = entry.faces.filter((f)=>fonts.indexOf(f) === -1);
        if (entry.faces.length === 0) {
            cached.entries = cached.entries.filter((f)=>f !== entry);
        }
        fonts.forEach((t)=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getFontFaceSet().delete(t);
        });
        if (cached.entries.length === 0) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].remove(`${fontFamily}-and-url`);
        }
    }
};
;
 //# sourceMappingURL=loadWebFont.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/textures/utils/createTexture.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createTexture",
    ()=>createTexture
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/cache/Cache.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
function createTexture(source, loader, url) {
    source.label = url;
    source._sourceOrigin = url;
    const texture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]({
        source,
        label: url
    });
    const unload = ()=>{
        delete loader.promiseCache[url];
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].has(url)) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].remove(url);
        }
    };
    texture.source.once("destroy", ()=>{
        if (loader.promiseCache[url]) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("[Assets] A TextureSource managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the TextureSource.");
            unload();
        }
    });
    texture.once("destroy", ()=>{
        if (!source.destroyed) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("[Assets] A Texture managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the Texture.");
            unload();
        }
    });
    return texture;
}
;
 //# sourceMappingURL=createTexture.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/textures/loadSVG.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadSvg",
    ()=>loadSvg
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$ImageSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/ImageSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/GraphicsContext.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$network$2f$getResolutionOfUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/network/getResolutionOfUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkDataUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkExtension.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/LoaderParser.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$utils$2f$createTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/textures/utils/createTexture.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
"use strict";
const validSVGExtension = ".svg";
const validSVGMIME = "image/svg+xml";
const loadSvg = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].LoadParser,
        priority: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LoaderParserPriority"].Low,
        name: "loadSVG"
    },
    /** used for deprecation purposes */ name: "loadSVG",
    id: "svg",
    config: {
        crossOrigin: "anonymous",
        parseAsGraphicsContext: false
    },
    test (url) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkDataUrl"])(url, validSVGMIME) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkExtension"])(url, validSVGExtension);
    },
    async load (url, asset, loader) {
        if (asset.data?.parseAsGraphicsContext ?? this.config.parseAsGraphicsContext) {
            return loadAsGraphics(url);
        }
        return loadAsTexture(url, asset, loader, this.config.crossOrigin);
    },
    unload (asset) {
        asset.destroy(true);
    }
};
async function loadAsTexture(url, asset, loader, crossOrigin) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().fetch(url);
    const image = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createImage();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await response.text())}`;
    image.crossOrigin = crossOrigin;
    await image.decode();
    const width = asset.data?.width ?? image.width;
    const height = asset.data?.height ?? image.height;
    const resolution = asset.data?.resolution || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$network$2f$getResolutionOfUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getResolutionOfUrl"])(url);
    const canvasWidth = Math.ceil(width * resolution);
    const canvasHeight = Math.ceil(height * resolution);
    const canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width * resolution, height * resolution);
    const { parseAsGraphicsContext: _p, ...rest } = asset.data ?? {};
    const base = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$ImageSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ImageSource"]({
        resource: canvas,
        alphaMode: "premultiply-alpha-on-upload",
        resolution,
        ...rest
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$utils$2f$createTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createTexture"])(base, loader, url);
}
async function loadAsGraphics(url) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().fetch(url);
    const svgSource = await response.text();
    const context = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GraphicsContext"]();
    context.svg(svgSource);
    return context;
}
;
 //# sourceMappingURL=loadSVG.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/workers/WorkerManager.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WorkerManager",
    ()=>WorkerManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$_virtual$2f$checkImageBitmap$2e$worker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/_virtual/checkImageBitmap.worker.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$_virtual$2f$loadImageBitmap$2e$worker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/_virtual/loadImageBitmap.worker.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
let UUID = 0;
let MAX_WORKERS;
class WorkerManagerClass {
    constructor(){
        /** Whether the worker manager has been initialized */ this._initialized = false;
        /** Current number of created workers (used to enforce MAX_WORKERS limit) */ this._createdWorkers = 0;
        this._workerPool = [];
        this._queue = [];
        this._resolveHash = {};
    }
    /**
   * Checks if ImageBitmap is supported in the current environment.
   *
   * This method uses a dedicated worker to test ImageBitmap support
   * and caches the result for subsequent calls.
   * @returns Promise that resolves to true if ImageBitmap is supported, false otherwise
   */ isImageBitmapSupported() {
        if (this._isImageBitmapSupported !== void 0) return this._isImageBitmapSupported;
        this._isImageBitmapSupported = new Promise((resolve)=>{
            const { worker } = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$_virtual$2f$checkImageBitmap$2e$worker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]();
            worker.addEventListener("message", (event)=>{
                worker.terminate();
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$_virtual$2f$checkImageBitmap$2e$worker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].revokeObjectURL();
                resolve(event.data);
            });
        });
        return this._isImageBitmapSupported;
    }
    /**
   * Loads an image as an ImageBitmap using a web worker.
   * @param src - The source URL or path of the image to load
   * @param asset - Optional resolved asset containing additional texture source options
   * @returns Promise that resolves to the loaded ImageBitmap
   * @example
   * ```typescript
   * const bitmap = await WorkerManager.loadImageBitmap('image.png');
   * const bitmapWithOptions = await WorkerManager.loadImageBitmap('image.png', asset);
   * ```
   */ loadImageBitmap(src, asset) {
        return this._run("loadImageBitmap", [
            src,
            asset?.data?.alphaMode
        ]);
    }
    /**
   * Initializes the worker pool if not already initialized.
   * Currently a no-op but reserved for future initialization logic.
   */ async _initWorkers() {
        if (this._initialized) return;
        this._initialized = true;
    }
    /**
   * Gets an available worker from the pool or creates a new one if needed.
   *
   * Workers are created up to the MAX_WORKERS limit (based on navigator.hardwareConcurrency).
   * Each worker is configured with a message handler for processing results.
   * @returns Available worker or undefined if pool is at capacity and no workers are free
   */ _getWorker() {
        if (MAX_WORKERS === void 0) {
            MAX_WORKERS = navigator.hardwareConcurrency || 4;
        }
        let worker = this._workerPool.pop();
        if (!worker && this._createdWorkers < MAX_WORKERS) {
            this._createdWorkers++;
            worker = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$_virtual$2f$loadImageBitmap$2e$worker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]().worker;
            worker.addEventListener("message", (event)=>{
                this._complete(event.data);
                this._returnWorker(event.target);
                this._next();
            });
        }
        return worker;
    }
    /**
   * Returns a worker to the pool after completing a task.
   * @param worker - The worker to return to the pool
   */ _returnWorker(worker) {
        this._workerPool.push(worker);
    }
    /**
   * Handles completion of a worker task by resolving or rejecting the corresponding promise.
   * @param data - Result data from the worker containing uuid, data, and optional error
   */ _complete(data) {
        if (data.error !== void 0) {
            this._resolveHash[data.uuid].reject(data.error);
        } else {
            this._resolveHash[data.uuid].resolve(data.data);
        }
        this._resolveHash[data.uuid] = null;
    }
    /**
   * Executes a task using the worker pool system.
   *
   * Queues the task and processes it when a worker becomes available.
   * @param id - Identifier for the type of task to run
   * @param args - Arguments to pass to the worker
   * @returns Promise that resolves with the worker's result
   */ async _run(id, args) {
        await this._initWorkers();
        const promise = new Promise((resolve, reject)=>{
            this._queue.push({
                id,
                arguments: args,
                resolve,
                reject
            });
        });
        this._next();
        return promise;
    }
    /**
   * Processes the next item in the queue if workers are available.
   *
   * This method is called after worker initialization and when workers
   * complete tasks to continue processing the queue.
   */ _next() {
        if (!this._queue.length) return;
        const worker = this._getWorker();
        if (!worker) {
            return;
        }
        const toDo = this._queue.pop();
        const id = toDo.id;
        this._resolveHash[UUID] = {
            resolve: toDo.resolve,
            reject: toDo.reject
        };
        worker.postMessage({
            data: toDo.arguments,
            uuid: UUID++,
            id
        });
    }
    /**
   * Resets the worker manager, terminating all workers and clearing the queue.
   *
   * This method:
   * - Terminates all active workers
   * - Rejects all pending promises with an error
   * - Clears all internal state
   * - Resets initialization flags
   *
   * This should be called when the worker manager is no longer needed
   * to prevent memory leaks and ensure proper cleanup.
   * @example
   * ```typescript
   * // Clean up when shutting down
   * WorkerManager.reset();
   * ```
   */ reset() {
        this._workerPool.forEach((worker)=>worker.terminate());
        this._workerPool.length = 0;
        Object.values(this._resolveHash).forEach(({ reject })=>{
            reject?.(new Error("WorkerManager destroyed"));
        });
        this._resolveHash = {};
        this._queue.length = 0;
        this._initialized = false;
        this._createdWorkers = 0;
    }
}
const WorkerManager = new WorkerManagerClass();
;
 //# sourceMappingURL=WorkerManager.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/textures/loadTextures.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadImageBitmap",
    ()=>loadImageBitmap,
    "loadTextures",
    ()=>loadTextures
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$ImageSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/ImageSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$network$2f$getResolutionOfUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/network/getResolutionOfUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkDataUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkExtension.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$workers$2f$WorkerManager$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/workers/WorkerManager.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/LoaderParser.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$utils$2f$createTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/textures/utils/createTexture.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
"use strict";
const validImageExtensions = [
    ".jpeg",
    ".jpg",
    ".png",
    ".webp",
    ".avif"
];
const validImageMIMEs = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif"
];
async function loadImageBitmap(url, asset) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().fetch(url);
    if (!response.ok) {
        throw new Error(`[loadImageBitmap] Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const imageBlob = await response.blob();
    return asset?.data?.alphaMode === "premultiplied-alpha" ? createImageBitmap(imageBlob, {
        premultiplyAlpha: "none"
    }) : createImageBitmap(imageBlob);
}
const loadTextures = {
    /** used for deprecation purposes */ name: "loadTextures",
    id: "texture",
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].LoadParser,
        priority: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LoaderParserPriority"].High,
        name: "loadTextures"
    },
    config: {
        preferWorkers: true,
        preferCreateImageBitmap: true,
        crossOrigin: "anonymous"
    },
    test (url) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkDataUrl"])(url, validImageMIMEs) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkExtension"])(url, validImageExtensions);
    },
    async load (url, asset, loader) {
        let src = null;
        if (globalThis.createImageBitmap && this.config.preferCreateImageBitmap) {
            if (this.config.preferWorkers && await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$workers$2f$WorkerManager$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WorkerManager"].isImageBitmapSupported()) {
                src = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$workers$2f$WorkerManager$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WorkerManager"].loadImageBitmap(url, asset);
            } else {
                src = await loadImageBitmap(url, asset);
            }
        } else {
            src = await new Promise((resolve, reject)=>{
                src = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createImage();
                src.crossOrigin = this.config.crossOrigin;
                src.src = url;
                if (src.complete) {
                    resolve(src);
                } else {
                    src.onload = ()=>{
                        resolve(src);
                    };
                    src.onerror = reject;
                }
            });
        }
        const base = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$ImageSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ImageSource"]({
            resource: src,
            alphaMode: "premultiply-alpha-on-upload",
            resolution: asset.data?.resolution || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$network$2f$getResolutionOfUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getResolutionOfUrl"])(url),
            ...asset.data
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$utils$2f$createTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createTexture"])(base, loader, url);
    },
    unload (texture) {
        texture.destroy(true);
    }
};
;
 //# sourceMappingURL=loadTextures.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/textures/loadVideoTextures.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "crossOrigin",
    ()=>crossOrigin,
    "determineCrossOrigin",
    ()=>determineCrossOrigin,
    "loadVideoTextures",
    ()=>loadVideoTextures,
    "preloadVideo",
    ()=>preloadVideo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$VideoSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/VideoSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$detectVideoAlphaMode$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/detectVideoAlphaMode.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$network$2f$getResolutionOfUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/network/getResolutionOfUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testVideoFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/utils/testVideoFormat.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkDataUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/checkExtension.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$utils$2f$createTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/textures/utils/createTexture.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
"use strict";
const potentialVideoExtensions = [
    ".mp4",
    ".m4v",
    ".webm",
    ".ogg",
    ".ogv",
    ".h264",
    ".avi",
    ".mov"
];
let validVideoExtensions;
let validVideoMIMEs;
function crossOrigin(element, url, crossorigin) {
    if (crossorigin === void 0 && !url.startsWith("data:")) {
        element.crossOrigin = determineCrossOrigin(url);
    } else if (crossorigin !== false) {
        element.crossOrigin = typeof crossorigin === "string" ? crossorigin : "anonymous";
    }
}
function preloadVideo(element) {
    return new Promise((resolve, reject)=>{
        element.addEventListener("canplaythrough", loaded);
        element.addEventListener("error", error);
        element.load();
        function loaded() {
            cleanup();
            resolve();
        }
        function error(err) {
            cleanup();
            reject(err);
        }
        function cleanup() {
            element.removeEventListener("canplaythrough", loaded);
            element.removeEventListener("error", error);
        }
    });
}
function determineCrossOrigin(url, loc = globalThis.location) {
    if (url.startsWith("data:")) {
        return "";
    }
    loc || (loc = globalThis.location);
    const parsedUrl = new URL(url, document.baseURI);
    if (parsedUrl.hostname !== loc.hostname || parsedUrl.port !== loc.port || parsedUrl.protocol !== loc.protocol) {
        return "anonymous";
    }
    return "";
}
function getBrowserSupportedVideoExtensions() {
    const supportedExtensions = [];
    const supportedMimes = [];
    for (const ext of potentialVideoExtensions){
        const mimeType = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$VideoSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoSource"].MIME_TYPES[ext.substring(1)] || `video/${ext.substring(1)}`;
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$utils$2f$testVideoFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["testVideoFormat"])(mimeType)) {
            supportedExtensions.push(ext);
            if (!supportedMimes.includes(mimeType)) {
                supportedMimes.push(mimeType);
            }
        }
    }
    return {
        validVideoExtensions: supportedExtensions,
        validVideoMime: supportedMimes
    };
}
const loadVideoTextures = {
    /** used for deprecation purposes */ name: "loadVideo",
    id: "video",
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].LoadParser,
        name: "loadVideo"
    },
    test (url) {
        if (!validVideoExtensions || !validVideoMIMEs) {
            const { validVideoExtensions: ve, validVideoMime: vm } = getBrowserSupportedVideoExtensions();
            validVideoExtensions = ve;
            validVideoMIMEs = vm;
        }
        const isValidDataUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkDataUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkDataUrl"])(url, validVideoMIMEs);
        const isValidExtension = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$checkExtension$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkExtension"])(url, validVideoExtensions);
        return isValidDataUrl || isValidExtension;
    },
    async load (url, asset, loader) {
        const options = {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$VideoSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoSource"].defaultOptions,
            resolution: asset.data?.resolution || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$network$2f$getResolutionOfUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getResolutionOfUrl"])(url),
            alphaMode: asset.data?.alphaMode || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$detectVideoAlphaMode$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["detectVideoAlphaMode"])(),
            ...asset.data
        };
        const videoElement = document.createElement("video");
        const attributeMap = {
            preload: options.autoLoad !== false ? "auto" : void 0,
            "webkit-playsinline": options.playsinline !== false ? "" : void 0,
            playsinline: options.playsinline !== false ? "" : void 0,
            muted: options.muted === true ? "" : void 0,
            loop: options.loop === true ? "" : void 0,
            autoplay: options.autoPlay !== false ? "" : void 0
        };
        Object.keys(attributeMap).forEach((key)=>{
            const value = attributeMap[key];
            if (value !== void 0) videoElement.setAttribute(key, value);
        });
        if (options.muted === true) {
            videoElement.muted = true;
        }
        crossOrigin(videoElement, url, options.crossorigin);
        const sourceElement = document.createElement("source");
        let mime;
        if (options.mime) {
            mime = options.mime;
        } else if (url.startsWith("data:")) {
            mime = url.slice(5, url.indexOf(";"));
        } else if (!url.startsWith("blob:")) {
            const ext = url.split("?")[0].slice(url.lastIndexOf(".") + 1).toLowerCase();
            mime = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$VideoSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoSource"].MIME_TYPES[ext] || `video/${ext}`;
        }
        sourceElement.src = url;
        if (mime) {
            sourceElement.type = mime;
        }
        return new Promise((resolve)=>{
            const onCanPlay = async ()=>{
                const base = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$VideoSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoSource"]({
                    ...options,
                    resource: videoElement
                });
                videoElement.removeEventListener("canplay", onCanPlay);
                if (asset.data.preload) {
                    await preloadVideo(videoElement);
                }
                resolve((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$utils$2f$createTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createTexture"])(base, loader, url));
            };
            if (options.preload && !options.autoPlay) {
                videoElement.load();
            }
            videoElement.addEventListener("canplay", onCanPlay);
            videoElement.appendChild(sourceElement);
        });
    },
    unload (texture) {
        texture.destroy(true);
    }
};
;
 //# sourceMappingURL=loadVideoTextures.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/resolver/parsers/resolveTextureUrl.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveTextureUrl",
    ()=>resolveTextureUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$loadTextures$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/textures/loadTextures.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$Resolver$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/resolver/Resolver.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const resolveTextureUrl = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].ResolveParser,
        name: "resolveTexture"
    },
    test: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$loadTextures$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadTextures"].test,
    parse: (value)=>({
            resolution: parseFloat(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$Resolver$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Resolver"].RETINA_PREFIX.exec(value)?.[1] ?? "1"),
            format: value.split(".").pop(),
            src: value
        })
};
;
 //# sourceMappingURL=resolveTextureUrl.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/resolver/parsers/resolveJsonUrl.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveJsonUrl",
    ()=>resolveJsonUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$Resolver$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/resolver/Resolver.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$parsers$2f$resolveTextureUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/resolver/parsers/resolveTextureUrl.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const resolveJsonUrl = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].ResolveParser,
        priority: -2,
        name: "resolveJson"
    },
    test: (value)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$Resolver$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Resolver"].RETINA_PREFIX.test(value) && value.endsWith(".json"),
    parse: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$parsers$2f$resolveTextureUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveTextureUrl"].parse
};
;
 //# sourceMappingURL=resolveJsonUrl.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/Assets.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Assets",
    ()=>Assets,
    "AssetsClass",
    ()=>AssetsClass
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$loadBitmapFont$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/asset/loadBitmapFont.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$BackgroundLoader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/BackgroundLoader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/cache/Cache.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$parsers$2f$cacheTextureArray$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/cache/parsers/cacheTextureArray.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectAvif$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectAvif.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectDefaults$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectDefaults.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectMp4$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectMp4.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectOgv$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectOgv.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectWebm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectWebm.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectWebp$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/detections/parsers/detectWebp.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$Loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/Loader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$loadJson$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/loadJson.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$loadTxt$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/loadTxt.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$loadWebFont$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/loadWebFont.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$loadSVG$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/textures/loadSVG.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$loadTextures$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/textures/loadTextures.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$loadVideoTextures$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/textures/loadVideoTextures.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$parsers$2f$resolveJsonUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/resolver/parsers/resolveJsonUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$parsers$2f$resolveTextureUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/resolver/parsers/resolveTextureUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$Resolver$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/resolver/Resolver.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/convertToList.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$isSingleItem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/isSingleItem.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
"use strict";
class AssetsClass {
    constructor(){
        this._detections = [];
        this._initialized = false;
        this.resolver = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$Resolver$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Resolver"]();
        this.loader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$Loader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Loader"]();
        this.cache = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"];
        this._backgroundLoader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$BackgroundLoader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BackgroundLoader"](this.loader);
        this._backgroundLoader.active = true;
        this.reset();
    }
    /**
   * Initializes the Assets class with configuration options. While not required,
   * calling this before loading assets is recommended to set up default behaviors.
   * @param options - Configuration options for the Assets system
   * @example
   * ```ts
   * // Basic initialization (optional as Assets.load will call this automatically)
   * await Assets.init();
   *
   * // With CDN configuration
   * await Assets.init({
   *     basePath: 'https://my-cdn.com/assets/',
   *     defaultSearchParams: { version: '1.0.0' }
   * });
   *
   * // With manifest and preferences
   * await Assets.init({
   *     manifest: {
   *         bundles: [{
   *             name: 'game-screen',
   *             assets: [
   *                 {
   *                     alias: 'hero',
   *                     src: 'hero.{png,webp}',
   *                     data: { scaleMode: SCALE_MODES.NEAREST }
   *                 },
   *                 {
   *                     alias: 'map',
   *                     src: 'map.json'
   *                 }
   *             ]
   *         }]
   *     },
   *     // Optimize for device capabilities
   *     texturePreference: {
   *         resolution: window.devicePixelRatio,
   *         format: ['webp', 'png']
   *     },
   *     // Set global preferences
   *     preferences: {
   *         crossOrigin: 'anonymous',
   *     }
   * });
   *
   * // Load assets after initialization
   * const heroTexture = await Assets.load('hero');
   * ```
   * @remarks
   * - Can be called only once; subsequent calls will be ignored with a warning
   * - Format detection runs automatically unless `skipDetections` is true
   * - The manifest can be a URL to a JSON file or an inline object
   * @see {@link AssetInitOptions} For all available initialization options
   * @see {@link AssetsManifest} For manifest format details
   */ async init(options = {}) {
        if (this._initialized) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("[Assets]AssetManager already initialized, did you load before calling this Assets.init()?");
            return;
        }
        this._initialized = true;
        if (options.defaultSearchParams) {
            this.resolver.setDefaultSearchParams(options.defaultSearchParams);
        }
        if (options.basePath) {
            this.resolver.basePath = options.basePath;
        }
        if (options.bundleIdentifier) {
            this.resolver.setBundleIdentifier(options.bundleIdentifier);
        }
        if (options.manifest) {
            let manifest = options.manifest;
            if (typeof manifest === "string") {
                manifest = await this.load(manifest);
            }
            this.resolver.addManifest(manifest);
        }
        const resolutionPref = options.texturePreference?.resolution ?? 1;
        const resolution = typeof resolutionPref === "number" ? [
            resolutionPref
        ] : resolutionPref;
        const formats = await this._detectFormats({
            preferredFormats: options.texturePreference?.format,
            skipDetections: options.skipDetections,
            detections: this._detections
        });
        this.resolver.prefer({
            params: {
                format: formats,
                resolution
            }
        });
        if (options.preferences) {
            this.setPreferences(options.preferences);
        }
    }
    /**
   * Registers assets with the Assets resolver. This method maps keys (aliases) to asset sources,
   * allowing you to load assets using friendly names instead of direct URLs.
   * @param assets - The unresolved assets to add to the resolver
   * @example
   * ```ts
   * // Basic usage - single asset
   * Assets.add({
   *     alias: 'myTexture',
   *     src: 'assets/texture.png'
   * });
   * const texture = await Assets.load('myTexture');
   *
   * // Multiple aliases for the same asset
   * Assets.add({
   *     alias: ['hero', 'player'],
   *     src: 'hero.png'
   * });
   * const hero1 = await Assets.load('hero');
   * const hero2 = await Assets.load('player'); // Same texture
   *
   * // Multiple format support
   * Assets.add({
   *     alias: 'character',
   *     src: 'character.{webp,png}' // Will choose best format
   * });
   * Assets.add({
   *     alias: 'character',
   *     src: ['character.webp', 'character.png'], // Explicitly specify formats
   * });
   *
   * // With texture options
   * Assets.add({
   *     alias: 'sprite',
   *     src: 'sprite.png',
   *     data: { scaleMode: 'nearest' }
   * });
   *
   * // Multiple assets at once
   * Assets.add([
   *     { alias: 'bg', src: 'background.png' },
   *     { alias: 'music', src: 'music.mp3' },
   *     { alias: 'spritesheet', src: 'sheet.json', data: { ignoreMultiPack: false } }
   * ]);
   * ```
   * @remarks
   * - Assets are resolved when loaded, not when added
   * - Multiple formats use the best available format for the browser
   * - Adding with same alias overwrites previous definition
   * - The `data` property is passed to the asset loader
   * @see {@link Resolver} For details on asset resolution
   * @see {@link LoaderParser} For asset-specific data options
   * @advanced
   */ add(assets) {
        this.resolver.add(assets);
    }
    async load(urls, onProgress) {
        if (!this._initialized) {
            await this.init();
        }
        const singleAsset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$isSingleItem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isSingleItem"])(urls);
        const urlArray = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["convertToList"])(urls).map((url)=>{
            if (typeof url !== "string") {
                const aliases = this.resolver.getAlias(url);
                if (aliases.some((alias)=>!this.resolver.hasKey(alias))) {
                    this.add(url);
                }
                return Array.isArray(aliases) ? aliases[0] : aliases;
            }
            if (!this.resolver.hasKey(url)) this.add({
                alias: url,
                src: url
            });
            return url;
        });
        const resolveResults = this.resolver.resolve(urlArray);
        const out = await this._mapLoadToResolve(resolveResults, onProgress);
        return singleAsset ? out[urlArray[0]] : out;
    }
    /**
   * Registers a bundle of assets that can be loaded as a group. Bundles are useful for organizing
   * assets into logical groups, such as game levels or UI screens.
   * @param bundleId - Unique identifier for the bundle
   * @param assets - Assets to include in the bundle
   * @example
   * ```ts
   * // Add a bundle using array format
   * Assets.addBundle('animals', [
   *     { alias: 'bunny', src: 'bunny.png' },
   *     { alias: 'chicken', src: 'chicken.png' },
   *     { alias: 'thumper', src: 'thumper.png' },
   * ]);
   *
   * // Add a bundle using object format
   * Assets.addBundle('animals', {
   *     bunny: 'bunny.png',
   *     chicken: 'chicken.png',
   *     thumper: 'thumper.png',
   * });
   *
   * // Add a bundle with advanced options
   * Assets.addBundle('ui', [
   *     {
   *         alias: 'button',
   *         src: 'button.{webp,png}',
   *         data: { scaleMode: 'nearest' }
   *     },
   *     {
   *         alias: ['logo', 'brand'],  // Multiple aliases
   *         src: 'logo.svg',
   *         data: { resolution: 2 }
   *     }
   * ]);
   *
   * // Load the bundle
   * await Assets.loadBundle('animals');
   *
   * // Use the loaded assets
   * const bunny = Sprite.from('bunny');
   * const chicken = Sprite.from('chicken');
   * ```
   * @remarks
   * - Bundle IDs must be unique
   * - Assets in bundles are not loaded until `loadBundle` is called
   * - Bundles can be background loaded using `backgroundLoadBundle`
   * - Assets in bundles can be loaded individually using their aliases
   * @see {@link Assets.loadBundle} For loading bundles
   * @see {@link Assets.backgroundLoadBundle} For background loading bundles
   * @see {@link Assets.unloadBundle} For unloading bundles
   * @see {@link AssetsManifest} For manifest format details
   */ addBundle(bundleId, assets) {
        this.resolver.addBundle(bundleId, assets);
    }
    /**
   * Loads a bundle or multiple bundles of assets. Bundles are collections of related assets
   * that can be loaded together.
   * @param bundleIds - Single bundle ID or array of bundle IDs to load
   * @param onProgress - Optional callback for load progress (0.0 to 1.0)
   * @returns Promise that resolves with the loaded bundle assets
   * @example
   * ```ts
   * // Define bundles in your manifest
   * const manifest = {
   *     bundles: [
   *         {
   *             name: 'load-screen',
   *             assets: [
   *                 {
   *                     alias: 'background',
   *                     src: 'sunset.png',
   *                 },
   *                 {
   *                     alias: 'bar',
   *                     src: 'load-bar.{png,webp}', // use an array of individual assets
   *                 },
   *             ],
   *         },
   *         {
   *             name: 'game-screen',
   *             assets: [
   *                 {
   *                     alias: 'character',
   *                     src: 'robot.png',
   *                 },
   *                 {
   *                     alias: 'enemy',
   *                     src: 'bad-guy.png',
   *                 },
   *             ],
   *         },
   *     ]
   * };
   *
   * // Initialize with manifest
   * await Assets.init({ manifest });
   *
   * // Or add bundles programmatically
   * Assets.addBundle('load-screen', [...]);
   * Assets.loadBundle('load-screen');
   *
   * // Load a single bundle
   * await Assets.loadBundle('load-screen');
   * const bg = Sprite.from('background'); // Uses alias from bundle
   *
   * // Load multiple bundles
   * await Assets.loadBundle([
   *     'load-screen',
   *     'game-screen'
   * ]);
   *
   * // Load with progress tracking
   * await Assets.loadBundle('game-screen', (progress) => {
   *     console.log(`Loading: ${Math.round(progress * 100)}%`);
   * });
   * ```
   * @remarks
   * - Bundle assets are cached automatically
   * - Bundles can be pre-loaded using `backgroundLoadBundle`
   * - Assets in bundles can be accessed by their aliases
   * - Progress callback receives values from 0.0 to 1.0
   * @throws {Error} If the bundle ID doesn't exist in the manifest
   * @see {@link Assets.addBundle} For adding bundles programmatically
   * @see {@link Assets.backgroundLoadBundle} For background loading bundles
   * @see {@link Assets.unloadBundle} For unloading bundles
   * @see {@link AssetsManifest} For manifest format details
   */ async loadBundle(bundleIds, onProgress) {
        if (!this._initialized) {
            await this.init();
        }
        let singleAsset = false;
        if (typeof bundleIds === "string") {
            singleAsset = true;
            bundleIds = [
                bundleIds
            ];
        }
        const resolveResults = this.resolver.resolveBundle(bundleIds);
        const out = {};
        const keys = Object.keys(resolveResults);
        let count = 0;
        let total = 0;
        const _onProgress = ()=>{
            onProgress?.(++count / total);
        };
        const promises = keys.map((bundleId)=>{
            const resolveResult = resolveResults[bundleId];
            const values = Object.values(resolveResult);
            const totalAssetsToLoad = [
                ...new Set(values.flat())
            ];
            total += totalAssetsToLoad.length;
            return this._mapLoadToResolve(resolveResult, _onProgress).then((resolveResult2)=>{
                out[bundleId] = resolveResult2;
            });
        });
        await Promise.all(promises);
        return singleAsset ? out[bundleIds[0]] : out;
    }
    /**
   * Initiates background loading of assets. This allows assets to be loaded passively while other operations
   * continue, making them instantly available when needed later.
   *
   * Background loading is useful for:
   * - Preloading game levels while in a menu
   * - Loading non-critical assets during gameplay
   * - Reducing visible loading screens
   * @param urls - Single URL/alias or array of URLs/aliases to load in the background
   * @example
   * ```ts
   * // Basic background loading
   * Assets.backgroundLoad('images/level2-assets.png');
   *
   * // Background load multiple assets
   * Assets.backgroundLoad([
   *     'images/sprite1.png',
   *     'images/sprite2.png',
   *     'images/background.png'
   * ]);
   *
   * // Later, when you need the assets
   * const textures = await Assets.load([
   *     'images/sprite1.png',
   *     'images/sprite2.png'
   * ]); // Resolves immediately if background loading completed
   * ```
   * @remarks
   * - Background loading happens one asset at a time to avoid blocking the main thread
   * - Loading can be interrupted safely by calling `Assets.load()`
   * - Assets are cached as they complete loading
   * - No progress tracking is available for background loading
   */ async backgroundLoad(urls) {
        if (!this._initialized) {
            await this.init();
        }
        if (typeof urls === "string") {
            urls = [
                urls
            ];
        }
        const resolveResults = this.resolver.resolve(urls);
        this._backgroundLoader.add(Object.values(resolveResults));
    }
    /**
   * Initiates background loading of asset bundles. Similar to backgroundLoad but works with
   * predefined bundles of assets.
   *
   * Perfect for:
   * - Preloading level bundles during gameplay
   * - Loading UI assets during splash screens
   * - Preparing assets for upcoming game states
   * @param bundleIds - Single bundle ID or array of bundle IDs to load in the background
   * @example
   * ```ts
   * // Define bundles in your manifest
   * await Assets.init({
   *     manifest: {
   *         bundles: [
   *             {
   *               name: 'home',
   *               assets: [
   *                 {
   *                     alias: 'background',
   *                     src: 'images/home-bg.png',
   *                 },
   *                 {
   *                     alias: 'logo',
   *                     src: 'images/logo.png',
   *                 }
   *              ]
   *            },
   *            {
   *             name: 'level-1',
   *             assets: [
   *                 {
   *                     alias: 'background',
   *                     src: 'images/level1/bg.png',
   *                 },
   *                 {
   *                     alias: 'sprites',
   *                     src: 'images/level1/sprites.json'
   *                 }
   *             ]
   *         }]
   *     }
   * });
   *
   * // Load the home screen assets right away
   * await Assets.loadBundle('home');
   * showHomeScreen();
   *
   * // Start background loading while showing home screen
   * Assets.backgroundLoadBundle('level-1');
   *
   * // When player starts level, load completes faster
   * await Assets.loadBundle('level-1');
   * hideHomeScreen();
   * startLevel();
   * ```
   * @remarks
   * - Bundle assets are loaded one at a time
   * - Loading can be interrupted safely by calling `Assets.loadBundle()`
   * - Assets are cached as they complete loading
   * - Requires bundles to be registered via manifest or `addBundle`
   * @see {@link Assets.addBundle} For adding bundles programmatically
   * @see {@link Assets.loadBundle} For immediate bundle loading
   * @see {@link AssetsManifest} For manifest format details
   */ async backgroundLoadBundle(bundleIds) {
        if (!this._initialized) {
            await this.init();
        }
        if (typeof bundleIds === "string") {
            bundleIds = [
                bundleIds
            ];
        }
        const resolveResults = this.resolver.resolveBundle(bundleIds);
        Object.values(resolveResults).forEach((resolveResult)=>{
            this._backgroundLoader.add(Object.values(resolveResult));
        });
    }
    /**
   * Only intended for development purposes.
   * This will wipe the resolver and caches.
   * You will need to reinitialize the Asset
   * @internal
   */ reset() {
        this.resolver.reset();
        this.loader.reset();
        this.cache.reset();
        this._initialized = false;
    }
    get(keys) {
        if (typeof keys === "string") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].get(keys);
        }
        const assets = {};
        for(let i = 0; i < keys.length; i++){
            assets[i] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].get(keys[i]);
        }
        return assets;
    }
    /**
   * helper function to map resolved assets back to loaded assets
   * @param resolveResults - the resolve results from the resolver
   * @param onProgress - the progress callback
   */ async _mapLoadToResolve(resolveResults, onProgress) {
        const resolveArray = [
            ...new Set(Object.values(resolveResults))
        ];
        this._backgroundLoader.active = false;
        const loadedAssets = await this.loader.load(resolveArray, onProgress);
        this._backgroundLoader.active = true;
        const out = {};
        resolveArray.forEach((resolveResult)=>{
            const asset = loadedAssets[resolveResult.src];
            const keys = [
                resolveResult.src
            ];
            if (resolveResult.alias) {
                keys.push(...resolveResult.alias);
            }
            keys.forEach((key)=>{
                out[key] = asset;
            });
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].set(keys, asset);
        });
        return out;
    }
    /**
   * Unloads assets and releases them from memory. This method ensures proper cleanup of
   * loaded assets when they're no longer needed.
   * @param urls - Single URL/alias or array of URLs/aliases to unload
   * @example
   * ```ts
   * // Unload a single asset
   * await Assets.unload('images/sprite.png');
   *
   * // Unload using an alias
   * await Assets.unload('hero'); // Unloads the asset registered with 'hero' alias
   *
   * // Unload multiple assets
   * await Assets.unload([
   *     'images/background.png',
   *     'images/character.png',
   *     'hero'
   * ]);
   *
   * // Unload and handle creation of new instances
   * await Assets.unload('hero');
   * const newHero = await Assets.load('hero'); // Will load fresh from source
   * ```
   * @remarks
   * > [!WARNING]
   * > Make sure assets aren't being used before unloading:
   * > - Remove sprites using the texture
   * > - Clear any references to the asset
   * > - Textures will be destroyed and can't be used after unloading
   * @throws {Error} If the asset is not found in cache
   */ async unload(urls) {
        if (!this._initialized) {
            await this.init();
        }
        const urlArray = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["convertToList"])(urls).map((url)=>typeof url !== "string" ? url.src : url);
        const resolveResults = this.resolver.resolve(urlArray);
        await this._unloadFromResolved(resolveResults);
    }
    /**
   * Unloads all assets in a bundle. Use this to free memory when a bundle's assets
   * are no longer needed, such as when switching game levels.
   * @param bundleIds - Single bundle ID or array of bundle IDs to unload
   * @example
   * ```ts
   * // Define and load a bundle
   * Assets.addBundle('level-1', {
   *     background: 'level1/bg.png',
   *     sprites: 'level1/sprites.json',
   *     music: 'level1/music.mp3'
   * });
   *
   * // Load the bundle
   * const level1 = await Assets.loadBundle('level-1');
   *
   * // Use the assets
   * const background = Sprite.from(level1.background);
   *
   * // When done with the level, unload everything
   * await Assets.unloadBundle('level-1');
   * // background sprite is now invalid!
   *
   * // Unload multiple bundles
   * await Assets.unloadBundle([
   *     'level-1',
   *     'level-2',
   *     'ui-elements'
   * ]);
   * ```
   * @remarks
   * > [!WARNING]
   * > - All assets in the bundle will be destroyed
   * > - Bundle needs to be reloaded to use assets again
   * > - Make sure no sprites or other objects are using the assets
   * @throws {Error} If the bundle is not found
   * @see {@link Assets.addBundle} For adding bundles
   * @see {@link Assets.loadBundle} For loading bundles
   */ async unloadBundle(bundleIds) {
        if (!this._initialized) {
            await this.init();
        }
        bundleIds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$convertToList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["convertToList"])(bundleIds);
        const resolveResults = this.resolver.resolveBundle(bundleIds);
        const promises = Object.keys(resolveResults).map((bundleId)=>this._unloadFromResolved(resolveResults[bundleId]));
        await Promise.all(promises);
    }
    async _unloadFromResolved(resolveResult) {
        const resolveArray = Object.values(resolveResult);
        resolveArray.forEach((resolveResult2)=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].remove(resolveResult2.src);
        });
        await this.loader.unload(resolveArray);
    }
    /**
   * Detects the supported formats for the browser, and returns an array of supported formats, respecting
   * the users preferred formats order.
   * @param options - the options to use when detecting formats
   * @param options.preferredFormats - the preferred formats to use
   * @param options.skipDetections - if we should skip the detections altogether
   * @param options.detections - the detections to use
   * @returns - the detected formats
   */ async _detectFormats(options) {
        let formats = [];
        if (options.preferredFormats) {
            formats = Array.isArray(options.preferredFormats) ? options.preferredFormats : [
                options.preferredFormats
            ];
        }
        for (const detection of options.detections){
            if (options.skipDetections || await detection.test()) {
                formats = await detection.add(formats);
            } else if (!options.skipDetections) {
                formats = await detection.remove(formats);
            }
        }
        formats = formats.filter((format, index)=>formats.indexOf(format) === index);
        return formats;
    }
    /**
   * All the detection parsers currently added to the Assets class.
   * @advanced
   */ get detections() {
        return this._detections;
    }
    /**
   * Sets global preferences for asset loading behavior. This method configures how assets
   * are loaded and processed across all parsers.
   * @param preferences - Asset loading preferences
   * @example
   * ```ts
   * // Basic preferences
   * Assets.setPreferences({
   *     crossOrigin: 'anonymous',
   *     parseAsGraphicsContext: false
   * });
   * ```
   * @remarks
   * Preferences are applied to all compatible parsers and affect future asset loading.
   * Common preferences include:
   * - `crossOrigin`: CORS setting for loaded assets
   * - `preferWorkers`: Whether to use web workers for loading textures
   * - `preferCreateImageBitmap`: Use `createImageBitmap` for texture creation. Turning this off will use the `Image` constructor instead.
   * @see {@link AssetsPreferences} For all available preferences
   */ setPreferences(preferences) {
        this.loader.parsers.forEach((parser)=>{
            if (!parser.config) return;
            Object.keys(parser.config).filter((key)=>key in preferences).forEach((key)=>{
                parser.config[key] = preferences[key];
            });
        });
    }
}
const Assets = new AssetsClass();
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handleByList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].LoadParser, Assets.loader.parsers).handleByList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].ResolveParser, Assets.resolver.parsers).handleByList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CacheParser, Assets.cache.parsers).handleByList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].DetectionParser, Assets.detections);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$parsers$2f$cacheTextureArray$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cacheTextureArray"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectDefaults$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["detectDefaults"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectAvif$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["detectAvif"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectWebp$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["detectWebp"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectMp4$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["detectMp4"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectOgv$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["detectOgv"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$detections$2f$parsers$2f$detectWebm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["detectWebm"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$loadJson$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadJson"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$loadTxt$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadTxt"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$loadWebFont$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadWebFont"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$loadSVG$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadSvg"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$loadTextures$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadTextures"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$textures$2f$loadVideoTextures$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadVideoTextures"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$loadBitmapFont$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadBitmapFont"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$loadBitmapFont$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["bitmapFontCachePlugin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$parsers$2f$resolveTextureUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveTextureUrl"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$parsers$2f$resolveJsonUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveJsonUrl"]);
const assetKeyMap = {
    loader: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].LoadParser,
    resolver: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].ResolveParser,
    cache: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CacheParser,
    detection: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].DetectionParser
};
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handle(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].Asset, (extension)=>{
    const ref = extension.ref;
    Object.entries(assetKeyMap).filter(([key])=>!!ref[key]).forEach(([key, type])=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(Object.assign(ref[key], // Allow the function to optionally define it's own
        // ExtensionMetadata, the use cases here is priority for LoaderParsers
        {
            extension: ref[key].extension ?? type
        })));
}, (extension)=>{
    const ref = extension.ref;
    Object.keys(assetKeyMap).filter((key)=>!!ref[key]).forEach((key)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].remove(ref[key]));
});
;
 //# sourceMappingURL=Assets.mjs.map
}),
];

//# sourceMappingURL=5703a_pixi_js_lib_assets_65915262._.js.map