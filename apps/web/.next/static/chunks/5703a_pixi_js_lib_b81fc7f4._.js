(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ExtensionType",
    ()=>ExtensionType,
    "extensions",
    ()=>extensions,
    "normalizeExtensionPriority",
    ()=>normalizeExtensionPriority
]);
"use strict";
var ExtensionType = /* @__PURE__ */ ((ExtensionType2)=>{
    ExtensionType2["Application"] = "application";
    ExtensionType2["WebGLPipes"] = "webgl-pipes";
    ExtensionType2["WebGLPipesAdaptor"] = "webgl-pipes-adaptor";
    ExtensionType2["WebGLSystem"] = "webgl-system";
    ExtensionType2["WebGPUPipes"] = "webgpu-pipes";
    ExtensionType2["WebGPUPipesAdaptor"] = "webgpu-pipes-adaptor";
    ExtensionType2["WebGPUSystem"] = "webgpu-system";
    ExtensionType2["CanvasSystem"] = "canvas-system";
    ExtensionType2["CanvasPipesAdaptor"] = "canvas-pipes-adaptor";
    ExtensionType2["CanvasPipes"] = "canvas-pipes";
    ExtensionType2["Asset"] = "asset";
    ExtensionType2["LoadParser"] = "load-parser";
    ExtensionType2["ResolveParser"] = "resolve-parser";
    ExtensionType2["CacheParser"] = "cache-parser";
    ExtensionType2["DetectionParser"] = "detection-parser";
    ExtensionType2["MaskEffect"] = "mask-effect";
    ExtensionType2["BlendMode"] = "blend-mode";
    ExtensionType2["TextureSource"] = "texture-source";
    ExtensionType2["Environment"] = "environment";
    ExtensionType2["ShapeBuilder"] = "shape-builder";
    ExtensionType2["Batcher"] = "batcher";
    return ExtensionType2;
})(ExtensionType || {});
const normalizeExtension = (ext)=>{
    if (typeof ext === "function" || typeof ext === "object" && ext.extension) {
        if (!ext.extension) {
            throw new Error("Extension class must have an extension object");
        }
        const metadata = typeof ext.extension !== "object" ? {
            type: ext.extension
        } : ext.extension;
        ext = {
            ...metadata,
            ref: ext
        };
    }
    if (typeof ext === "object") {
        ext = {
            ...ext
        };
    } else {
        throw new Error("Invalid extension type");
    }
    if (typeof ext.type === "string") {
        ext.type = [
            ext.type
        ];
    }
    return ext;
};
const normalizeExtensionPriority = (ext, defaultPriority)=>{
    var _normalizeExtension_priority;
    return (_normalizeExtension_priority = normalizeExtension(ext).priority) !== null && _normalizeExtension_priority !== void 0 ? _normalizeExtension_priority : defaultPriority;
};
const extensions = {
    /** @ignore */ _addHandlers: {},
    /** @ignore */ _removeHandlers: {},
    /** @ignore */ _queue: {},
    /**
   * Remove extensions from PixiJS.
   * @param extensions - Extensions to be removed. Can be:
   * - Extension class with static `extension` property
   * - Extension format object with `type` and `ref`
   * - Multiple extensions as separate arguments
   * @returns {extensions} this for chaining
   * @example
   * ```ts
   * // Remove a single extension
   * extensions.remove(MyRendererPlugin);
   *
   * // Remove multiple extensions
   * extensions.remove(
   *     MyRendererPlugin,
   *     MySystemPlugin
   * );
   * ```
   * @see {@link ExtensionType} For available extension types
   * @see {@link ExtensionFormat} For extension format details
   */ remove () {
        for(var _len = arguments.length, extensions2 = new Array(_len), _key = 0; _key < _len; _key++){
            extensions2[_key] = arguments[_key];
        }
        extensions2.map(normalizeExtension).forEach((ext)=>{
            ext.type.forEach((type)=>{
                var _this__removeHandlers_type, _this__removeHandlers;
                return (_this__removeHandlers_type = (_this__removeHandlers = this._removeHandlers)[type]) === null || _this__removeHandlers_type === void 0 ? void 0 : _this__removeHandlers_type.call(_this__removeHandlers, ext);
            });
        });
        return this;
    },
    /**
   * Register new extensions with PixiJS. Extensions can be registered in multiple formats:
   * - As a class with a static `extension` property
   * - As an extension format object
   * - As multiple extensions passed as separate arguments
   * @param extensions - Extensions to add to PixiJS. Each can be:
   * - A class with static `extension` property
   * - An extension format object with `type` and `ref`
   * - Multiple extensions as separate arguments
   * @returns This extensions instance for chaining
   * @example
   * ```ts
   * // Register a simple extension
   * extensions.add(MyRendererPlugin);
   *
   * // Register multiple extensions
   * extensions.add(
   *     MyRendererPlugin,
   *     MySystemPlugin,
   * });
   * ```
   * @see {@link ExtensionType} For available extension types
   * @see {@link ExtensionFormat} For extension format details
   * @see {@link extensions.remove} For removing registered extensions
   */ add () {
        for(var _len = arguments.length, extensions2 = new Array(_len), _key = 0; _key < _len; _key++){
            extensions2[_key] = arguments[_key];
        }
        extensions2.map(normalizeExtension).forEach((ext)=>{
            ext.type.forEach((type)=>{
                const handlers = this._addHandlers;
                const queue = this._queue;
                if (!handlers[type]) {
                    var _queue_type;
                    queue[type] = queue[type] || [];
                    (_queue_type = queue[type]) === null || _queue_type === void 0 ? void 0 : _queue_type.push(ext);
                } else {
                    var _handlers_type;
                    (_handlers_type = handlers[type]) === null || _handlers_type === void 0 ? void 0 : _handlers_type.call(handlers, ext);
                }
            });
        });
        return this;
    },
    /**
   * Internal method to handle extensions by name.
   * @param type - The extension type.
   * @param onAdd  - Function handler when extensions are added/registered {@link StrictExtensionFormat}.
   * @param onRemove  - Function handler when extensions are removed/unregistered {@link StrictExtensionFormat}.
   * @returns this for chaining.
   * @internal
   * @ignore
   */ handle (type, onAdd, onRemove) {
        const addHandlers = this._addHandlers;
        const removeHandlers = this._removeHandlers;
        if (addHandlers[type] || removeHandlers[type]) {
            throw new Error("Extension type ".concat(type, " already has a handler"));
        }
        addHandlers[type] = onAdd;
        removeHandlers[type] = onRemove;
        const queue = this._queue;
        if (queue[type]) {
            var _queue_type;
            (_queue_type = queue[type]) === null || _queue_type === void 0 ? void 0 : _queue_type.forEach((ext)=>onAdd(ext));
            delete queue[type];
        }
        return this;
    },
    /**
   * Handle a type, but using a map by `name` property.
   * @param type - Type of extension to handle.
   * @param map - The object map of named extensions.
   * @returns this for chaining.
   * @ignore
   */ handleByMap (type, map) {
        return this.handle(type, (extension)=>{
            if (extension.name) {
                map[extension.name] = extension.ref;
            }
        }, (extension)=>{
            if (extension.name) {
                delete map[extension.name];
            }
        });
    },
    /**
   * Handle a type, but using a list of extensions with a `name` property.
   * @param type - Type of extension to handle.
   * @param map - The array of named extensions.
   * @param defaultPriority - Fallback priority if none is defined.
   * @returns this for chaining.
   * @ignore
   */ handleByNamedList (type, map) {
        let defaultPriority = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : -1;
        return this.handle(type, (extension)=>{
            const index = map.findIndex((item)=>item.name === extension.name);
            if (index >= 0) return;
            map.push({
                name: extension.name,
                value: extension.ref
            });
            map.sort((a, b)=>normalizeExtensionPriority(b.value, defaultPriority) - normalizeExtensionPriority(a.value, defaultPriority));
        }, (extension)=>{
            const index = map.findIndex((item)=>item.name === extension.name);
            if (index !== -1) {
                map.splice(index, 1);
            }
        });
    },
    /**
   * Handle a type, but using a list of extensions.
   * @param type - Type of extension to handle.
   * @param list - The list of extensions.
   * @param defaultPriority - The default priority to use if none is specified.
   * @returns this for chaining.
   * @ignore
   */ handleByList (type, list) {
        let defaultPriority = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : -1;
        return this.handle(type, (extension)=>{
            if (list.includes(extension.ref)) {
                return;
            }
            list.push(extension.ref);
            list.sort((a, b)=>normalizeExtensionPriority(b, defaultPriority) - normalizeExtensionPriority(a, defaultPriority));
        }, (extension)=>{
            const index = list.indexOf(extension.ref);
            if (index !== -1) {
                list.splice(index, 1);
            }
        });
    },
    /**
   * Mixin the source object(s) properties into the target class's prototype.
   * Copies all property descriptors from source objects to the target's prototype.
   * @param Target - The target class to mix properties into
   * @param sources - One or more source objects containing properties to mix in
   * @example
   * ```ts
   * // Create a mixin with shared properties
   * const moveable = {
   *     x: 0,
   *     y: 0,
   *     move(x: number, y: number) {
   *         this.x += x;
   *         this.y += y;
   *     }
   * };
   *
   * // Create a mixin with computed properties
   * const scalable = {
   *     scale: 1,
   *     get scaled() {
   *         return this.scale > 1;
   *     }
   * };
   *
   * // Apply mixins to a class
   * extensions.mixin(Sprite, moveable, scalable);
   *
   * // Use mixed-in properties
   * const sprite = new Sprite();
   * sprite.move(10, 20);
   * console.log(sprite.x, sprite.y); // 10, 20
   * ```
   * @remarks
   * - Copies all properties including getters/setters
   * - Does not modify source objects
   * - Preserves property descriptors
   * @see {@link Object.defineProperties} For details on property descriptors
   * @see {@link Object.getOwnPropertyDescriptors} For details on property copying
   */ mixin (Target) {
        for(var _len = arguments.length, sources = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
            sources[_key - 1] = arguments[_key];
        }
        for (const source of sources){
            Object.defineProperties(Target.prototype, Object.getOwnPropertyDescriptors(source));
        }
    }
};
;
 //# sourceMappingURL=Extensions.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment-browser/browserExt.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "browserExt",
    ()=>browserExt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
;
"use strict";
const browserExt = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].Environment,
        name: "browser",
        priority: -1
    },
    test: ()=>true,
    load: async ()=>{
        await __turbopack_context__.A("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment-browser/browserAll.mjs [app-client] (ecmascript, async loader)");
    }
};
;
 //# sourceMappingURL=browserExt.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment-browser/BrowserAdapter.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BrowserAdapter",
    ()=>BrowserAdapter
]);
"use strict";
const BrowserAdapter = {
    createCanvas: (width, height)=>{
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    },
    createImage: ()=>new Image(),
    getCanvasRenderingContext2D: ()=>CanvasRenderingContext2D,
    getWebGLRenderingContext: ()=>WebGLRenderingContext,
    getNavigator: ()=>navigator,
    getBaseUrl: ()=>{
        var _document_baseURI;
        return (_document_baseURI = document.baseURI) !== null && _document_baseURI !== void 0 ? _document_baseURI : window.location.href;
    },
    getFontFaceSet: ()=>document.fonts,
    fetch: (url, options)=>fetch(url, options),
    parseXML: (xml)=>{
        const parser = new DOMParser();
        return parser.parseFromString(xml, "text/xml");
    }
};
;
 //# sourceMappingURL=BrowserAdapter.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment-webworker/webworkerExt.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "webworkerExt",
    ()=>webworkerExt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
;
"use strict";
const webworkerExt = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].Environment,
        name: "webworker",
        priority: 0
    },
    test: ()=>typeof self !== "undefined" && self.WorkerGlobalScope !== void 0,
    load: async ()=>{
        await __turbopack_context__.A("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment-webworker/webworkerAll.mjs [app-client] (ecmascript, async loader)");
    }
};
;
 //# sourceMappingURL=webworkerExt.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/ObservablePoint.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ObservablePoint",
    ()=>ObservablePoint
]);
"use strict";
class ObservablePoint {
    /**
   * Creates a clone of this point.
   * @example
   * ```ts
   * // Basic cloning
   * const point = new ObservablePoint(observer, 100, 200);
   * const copy = point.clone();
   *
   * // Clone with new observer
   * const newObserver = {
   *     _onUpdate: (p) => console.log(`Clone updated: (${p.x}, ${p.y})`)
   * };
   * const watched = point.clone(newObserver);
   *
   * // Verify independence
   * watched.set(300, 400); // Only triggers new observer
   * ```
   * @param observer - Optional observer to pass to the new observable point
   * @returns A copy of this observable point
   * @see {@link ObservablePoint.copyFrom} For copying into existing point
   * @see {@link Observer} For observer interface details
   */ clone(observer) {
        return new ObservablePoint(observer !== null && observer !== void 0 ? observer : this._observer, this._x, this._y);
    }
    /**
   * Sets the point to a new x and y position.
   *
   * If y is omitted, both x and y will be set to x.
   * @example
   * ```ts
   * // Basic position setting
   * const point = new ObservablePoint(observer);
   * point.set(100, 200);
   *
   * // Set both x and y to same value
   * point.set(50); // x=50, y=50
   * ```
   * @param x - Position on the x axis
   * @param y - Position on the y axis, defaults to x
   * @returns The point instance itself
   * @see {@link ObservablePoint.copyFrom} For copying from another point
   * @see {@link ObservablePoint.equals} For comparing positions
   */ set() {
        let x = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0, y = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : x;
        if (this._x !== x || this._y !== y) {
            this._x = x;
            this._y = y;
            this._observer._onUpdate(this);
        }
        return this;
    }
    /**
   * Copies x and y from the given point into this point.
   * @example
   * ```ts
   * // Basic copying
   * const source = new ObservablePoint(observer, 100, 200);
   * const target = new ObservablePoint();
   * target.copyFrom(source);
   *
   * // Copy and chain operations
   * const point = new ObservablePoint()
   *     .copyFrom(source)
   *     .set(x + 50, y + 50);
   *
   * // Copy from any PointData
   * const data = { x: 10, y: 20 };
   * point.copyFrom(data);
   * ```
   * @param p - The point to copy from
   * @returns The point instance itself
   * @see {@link ObservablePoint.copyTo} For copying to another point
   * @see {@link ObservablePoint.clone} For creating new point copy
   */ copyFrom(p) {
        if (this._x !== p.x || this._y !== p.y) {
            this._x = p.x;
            this._y = p.y;
            this._observer._onUpdate(this);
        }
        return this;
    }
    /**
   * Copies this point's x and y into the given point.
   * @example
   * ```ts
   * // Basic copying
   * const source = new ObservablePoint(100, 200);
   * const target = new ObservablePoint();
   * source.copyTo(target);
   * ```
   * @param p - The point to copy to. Can be any type that is or extends `PointLike`
   * @returns The point (`p`) with values updated
   * @see {@link ObservablePoint.copyFrom} For copying from another point
   * @see {@link ObservablePoint.clone} For creating new point copy
   */ copyTo(p) {
        p.set(this._x, this._y);
        return p;
    }
    /**
   * Checks if another point is equal to this point.
   *
   * Compares x and y values using strict equality.
   * @example
   * ```ts
   * // Basic equality check
   * const p1 = new ObservablePoint(100, 200);
   * const p2 = new ObservablePoint(100, 200);
   * console.log(p1.equals(p2)); // true
   *
   * // Compare with PointData
   * const data = { x: 100, y: 200 };
   * console.log(p1.equals(data)); // true
   *
   * // Check different points
   * const p3 = new ObservablePoint(200, 300);
   * console.log(p1.equals(p3)); // false
   * ```
   * @param p - The point to check
   * @returns `true` if both `x` and `y` are equal
   * @see {@link ObservablePoint.copyFrom} For making points equal
   * @see {@link PointData} For point data interface
   */ equals(p) {
        return p.x === this._x && p.y === this._y;
    }
    toString() {
        return "[pixi.js/math:ObservablePoint x=".concat(this._x, " y=").concat(this._y, " scope=").concat(this._observer, "]");
    }
    /**
   * Position of the observable point on the x axis.
   * Triggers observer callback when value changes.
   * @example
   * ```ts
   * // Basic x position
   * const point = new ObservablePoint(observer);
   * point.x = 100; // Triggers observer
   *
   * // Use in calculations
   * const width = rightPoint.x - leftPoint.x;
   * ```
   * @default 0
   */ get x() {
        return this._x;
    }
    set x(value) {
        if (this._x !== value) {
            this._x = value;
            this._observer._onUpdate(this);
        }
    }
    /**
   * Position of the observable point on the y axis.
   * Triggers observer callback when value changes.
   * @example
   * ```ts
   * // Basic y position
   * const point = new ObservablePoint(observer);
   * point.y = 200; // Triggers observer
   *
   * // Use in calculations
   * const height = bottomPoint.y - topPoint.y;
   * ```
   * @default 0
   */ get y() {
        return this._y;
    }
    set y(value) {
        if (this._y !== value) {
            this._y = value;
            this._observer._onUpdate(this);
        }
    }
    /**
   * Creates a new `ObservablePoint`
   * @param observer - Observer to pass to listen for change events.
   * @param {number} [x=0] - position of the point on the x axis
   * @param {number} [y=0] - position of the point on the y axis
   */ constructor(observer, x, y){
        this._x = x || 0;
        this._y = y || 0;
        this._observer = observer;
    }
}
;
 //# sourceMappingURL=ObservablePoint.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/misc/const.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEG_TO_RAD",
    ()=>DEG_TO_RAD,
    "PI_2",
    ()=>PI_2,
    "RAD_TO_DEG",
    ()=>RAD_TO_DEG
]);
"use strict";
const PI_2 = Math.PI * 2;
const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;
;
 //# sourceMappingURL=const.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/Point.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Point",
    ()=>Point
]);
"use strict";
class Point {
    /**
   * Creates a clone of this point, which is a new instance with the same `x` and `y` values.
   * @example
   * ```ts
   * // Basic point cloning
   * const original = new Point(100, 200);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.set(300, 400);
   *
   * // Verify independence
   * console.log(original); // Point(100, 200)
   * console.log(modified); // Point(300, 400)
   * ```
   * @remarks
   * - Creates new Point instance
   * - Deep copies x and y values
   * - Independent from original
   * - Useful for preserving values
   * @returns A clone of this point
   * @see {@link Point.copyFrom} For copying into existing point
   * @see {@link Point.copyTo} For copying to existing point
   */ clone() {
        return new Point(this.x, this.y);
    }
    /**
   * Copies x and y from the given point into this point.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Point(100, 200);
   * const target = new Point();
   * target.copyFrom(source);
   *
   * // Copy and chain operations
   * const point = new Point()
   *     .copyFrom(source)
   *     .set(x + 50, y + 50);
   *
   * // Copy from any PointData
   * const data = { x: 10, y: 20 };
   * point.copyFrom(data);
   * ```
   * @param p - The point to copy from
   * @returns The point instance itself
   * @see {@link Point.copyTo} For copying to another point
   * @see {@link Point.clone} For creating new point copy
   */ copyFrom(p) {
        this.set(p.x, p.y);
        return this;
    }
    /**
   * Copies this point's x and y into the given point.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Point(100, 200);
   * const target = new Point();
   * source.copyTo(target);
   * ```
   * @param p - The point to copy to. Can be any type that is or extends `PointLike`
   * @returns The point (`p`) with values updated
   * @see {@link Point.copyFrom} For copying from another point
   * @see {@link Point.clone} For creating new point copy
   */ copyTo(p) {
        p.set(this.x, this.y);
        return p;
    }
    /**
   * Checks if another point is equal to this point.
   *
   * Compares x and y values using strict equality.
   * @example
   * ```ts
   * // Basic equality check
   * const p1 = new Point(100, 200);
   * const p2 = new Point(100, 200);
   * console.log(p1.equals(p2)); // true
   *
   * // Compare with PointData
   * const data = { x: 100, y: 200 };
   * console.log(p1.equals(data)); // true
   *
   * // Check different points
   * const p3 = new Point(200, 300);
   * console.log(p1.equals(p3)); // false
   * ```
   * @param p - The point to check
   * @returns `true` if both `x` and `y` are equal
   * @see {@link Point.copyFrom} For making points equal
   * @see {@link PointData} For point data interface
   */ equals(p) {
        return p.x === this.x && p.y === this.y;
    }
    /**
   * Sets the point to a new x and y position.
   *
   * If y is omitted, both x and y will be set to x.
   * @example
   * ```ts
   * // Basic position setting
   * const point = new Point();
   * point.set(100, 200);
   *
   * // Set both x and y to same value
   * point.set(50); // x=50, y=50
   *
   * // Chain with other operations
   * point
   *     .set(10, 20)
   *     .copyTo(otherPoint);
   * ```
   * @param x - Position on the x axis
   * @param y - Position on the y axis, defaults to x
   * @returns The point instance itself
   * @see {@link Point.copyFrom} For copying from another point
   * @see {@link Point.equals} For comparing positions
   */ set() {
        let x = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0, y = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : x;
        this.x = x;
        this.y = y;
        return this;
    }
    toString() {
        return "[pixi.js/math:Point x=".concat(this.x, " y=").concat(this.y, "]");
    }
    /**
   * A static Point object with `x` and `y` values of `0`.
   *
   * This shared instance is reset to zero values when accessed.
   *
   * > [!IMPORTANT] This point is shared and temporary. Do not store references to it.
   * @example
   * ```ts
   * // Use for temporary calculations
   * const tempPoint = Point.shared;
   * tempPoint.set(100, 200);
   * matrix.apply(tempPoint);
   *
   * // Will be reset to (0,0) on next access
   * const fresh = Point.shared; // x=0, y=0
   * ```
   * @readonly
   * @returns A fresh zeroed point for temporary use
   * @see {@link Point.constructor} For creating new points
   * @see {@link PointData} For basic point interface
   */ static get shared() {
        tempPoint.x = 0;
        tempPoint.y = 0;
        return tempPoint;
    }
    /**
   * Creates a new `Point`
   * @param {number} [x=0] - position of the point on the x axis
   * @param {number} [y=0] - position of the point on the y axis
   */ constructor(x = 0, y = 0){
        /**
     * Position of the point on the x axis
     * @example
     * ```ts
     * // Set x position
     * const point = new Point();
     * point.x = 100;
     *
     * // Use in calculations
     * const width = rightPoint.x - leftPoint.x;
     * ```
     */ this.x = 0;
        /**
     * Position of the point on the y axis
     * @example
     * ```ts
     * // Set y position
     * const point = new Point();
     * point.y = 200;
     *
     * // Use in calculations
     * const height = bottomPoint.y - topPoint.y;
     * ```
     */ this.y = 0;
        this.x = x;
        this.y = y;
    }
}
const tempPoint = new Point();
;
 //# sourceMappingURL=Point.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Matrix",
    ()=>Matrix
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/misc/const.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/Point.mjs [app-client] (ecmascript)");
;
;
"use strict";
class Matrix {
    /**
   * Creates a Matrix object based on the given array.
   * Populates matrix components from a flat array in column-major order.
   *
   * > [!NOTE] Array mapping order:
   * > ```
   * > array[0] = a  (x scale)
   * > array[1] = b  (y skew)
   * > array[2] = tx (x translation)
   * > array[3] = c  (x skew)
   * > array[4] = d  (y scale)
   * > array[5] = ty (y translation)
   * > ```
   * @example
   * ```ts
   * // Create matrix from array
   * const matrix = new Matrix();
   * matrix.fromArray([
   *     2, 0,  100,  // a, b, tx
   *     0, 2,  100   // c, d, ty
   * ]);
   *
   * // Create matrix from typed array
   * const float32Array = new Float32Array([
   *     1, 0, 0,     // Scale x1, no skew
   *     0, 1, 0      // No skew, scale x1
   * ]);
   * matrix.fromArray(float32Array);
   * ```
   * @param array - The array to populate the matrix from
   * @see {@link Matrix.toArray} For converting matrix to array
   * @see {@link Matrix.set} For setting values directly
   */ fromArray(array) {
        this.a = array[0];
        this.b = array[1];
        this.c = array[3];
        this.d = array[4];
        this.tx = array[2];
        this.ty = array[5];
    }
    /**
   * Sets the matrix properties directly.
   * All matrix components can be set in one call.
   * @example
   * ```ts
   * // Set to identity matrix
   * matrix.set(1, 0, 0, 1, 0, 0);
   *
   * // Set to scale matrix
   * matrix.set(2, 0, 0, 2, 0, 0); // Scale 2x
   *
   * // Set to translation matrix
   * matrix.set(1, 0, 0, 1, 100, 50); // Move 100,50
   * ```
   * @param a - Scale on x axis
   * @param b - Shear on y axis
   * @param c - Shear on x axis
   * @param d - Scale on y axis
   * @param tx - Translation on x axis
   * @param ty - Translation on y axis
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.identity} For resetting to identity
   * @see {@link Matrix.fromArray} For setting from array
   */ set(a, b, c, d, tx, ty) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
        return this;
    }
    /**
   * Creates an array from the current Matrix object.
   *
   * > [!NOTE] The array format is:
   * > ```
   * > Non-transposed:
   * > [a, c, tx,
   * > b, d, ty,
   * > 0, 0, 1]
   * >
   * > Transposed:
   * > [a, b, 0,
   * > c, d, 0,
   * > tx,ty,1]
   * > ```
   * @example
   * ```ts
   * // Basic array conversion
   * const matrix = new Matrix(2, 0, 0, 2, 100, 100);
   * const array = matrix.toArray();
   *
   * // Using existing array
   * const float32Array = new Float32Array(9);
   * matrix.toArray(false, float32Array);
   *
   * // Get transposed array
   * const transposed = matrix.toArray(true);
   * ```
   * @param transpose - Whether to transpose the matrix
   * @param out - Optional Float32Array to store the result
   * @returns The array containing the matrix values
   * @see {@link Matrix.fromArray} For creating matrix from array
   * @see {@link Matrix.array} For cached array storage
   */ toArray(transpose, out) {
        if (!this.array) {
            this.array = new Float32Array(9);
        }
        const array = out || this.array;
        if (transpose) {
            array[0] = this.a;
            array[1] = this.b;
            array[2] = 0;
            array[3] = this.c;
            array[4] = this.d;
            array[5] = 0;
            array[6] = this.tx;
            array[7] = this.ty;
            array[8] = 1;
        } else {
            array[0] = this.a;
            array[1] = this.c;
            array[2] = this.tx;
            array[3] = this.b;
            array[4] = this.d;
            array[5] = this.ty;
            array[6] = 0;
            array[7] = 0;
            array[8] = 1;
        }
        return array;
    }
    /**
   * Get a new position with the current transformation applied.
   *
   * Can be used to go from a child's coordinate space to the world coordinate space. (e.g. rendering)
   * @example
   * ```ts
   * // Basic point transformation
   * const matrix = new Matrix().translate(100, 50).rotate(Math.PI / 4);
   * const point = new Point(10, 20);
   * const transformed = matrix.apply(point);
   *
   * // Reuse existing point
   * const output = new Point();
   * matrix.apply(point, output);
   * ```
   * @param pos - The origin point to transform
   * @param newPos - Optional point to store the result
   * @returns The transformed point
   * @see {@link Matrix.applyInverse} For inverse transformation
   * @see {@link Point} For point operations
   */ apply(pos, newPos) {
        newPos = newPos || new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"]();
        const x = pos.x;
        const y = pos.y;
        newPos.x = this.a * x + this.c * y + this.tx;
        newPos.y = this.b * x + this.d * y + this.ty;
        return newPos;
    }
    /**
   * Get a new position with the inverse of the current transformation applied.
   *
   * Can be used to go from the world coordinate space to a child's coordinate space. (e.g. input)
   * @example
   * ```ts
   * // Basic inverse transformation
   * const matrix = new Matrix().translate(100, 50).rotate(Math.PI / 4);
   * const worldPoint = new Point(150, 100);
   * const localPoint = matrix.applyInverse(worldPoint);
   *
   * // Reuse existing point
   * const output = new Point();
   * matrix.applyInverse(worldPoint, output);
   *
   * // Convert mouse position to local space
   * const mousePoint = new Point(mouseX, mouseY);
   * const localMouse = matrix.applyInverse(mousePoint);
   * ```
   * @param pos - The origin point to inverse-transform
   * @param newPos - Optional point to store the result
   * @returns The inverse-transformed point
   * @see {@link Matrix.apply} For forward transformation
   * @see {@link Matrix.invert} For getting inverse matrix
   */ applyInverse(pos, newPos) {
        newPos = newPos || new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"]();
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        const tx = this.tx;
        const ty = this.ty;
        const id = 1 / (a * d + c * -b);
        const x = pos.x;
        const y = pos.y;
        newPos.x = d * id * x + -c * id * y + (ty * c - tx * d) * id;
        newPos.y = a * id * y + -b * id * x + (-ty * a + tx * b) * id;
        return newPos;
    }
    /**
   * Translates the matrix on the x and y axes.
   * Adds to the position values while preserving scale, rotation and skew.
   * @example
   * ```ts
   * // Basic translation
   * const matrix = new Matrix();
   * matrix.translate(100, 50); // Move right 100, down 50
   *
   * // Chain with other transformations
   * matrix
   *     .scale(2, 2)
   *     .translate(100, 0)
   *     .rotate(Math.PI / 4);
   * ```
   * @param x - How much to translate on the x axis
   * @param y - How much to translate on the y axis
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.set} For setting position directly
   * @see {@link Matrix.setTransform} For complete transform setup
   */ translate(x, y) {
        this.tx += x;
        this.ty += y;
        return this;
    }
    /**
   * Applies a scale transformation to the matrix.
   * Multiplies the scale values with existing matrix components.
   * @example
   * ```ts
   * // Basic scaling
   * const matrix = new Matrix();
   * matrix.scale(2, 3); // Scale 2x horizontally, 3x vertically
   *
   * // Chain with other transformations
   * matrix
   *     .translate(100, 100)
   *     .scale(2, 2)     // Scales after translation
   *     .rotate(Math.PI / 4);
   * ```
   * @param x - The amount to scale horizontally
   * @param y - The amount to scale vertically
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.setTransform} For setting scale directly
   * @see {@link Matrix.append} For combining transformations
   */ scale(x, y) {
        this.a *= x;
        this.d *= y;
        this.c *= x;
        this.b *= y;
        this.tx *= x;
        this.ty *= y;
        return this;
    }
    /**
   * Applies a rotation transformation to the matrix.
   *
   * Rotates around the origin (0,0) by the given angle in radians.
   * @example
   * ```ts
   * // Basic rotation
   * const matrix = new Matrix();
   * matrix.rotate(Math.PI / 4); // Rotate 45 degrees
   *
   * // Chain with other transformations
   * matrix
   *     .translate(100, 100) // Move to rotation center
   *     .rotate(Math.PI)     // Rotate 180 degrees
   *     .scale(2, 2);        // Scale after rotation
   *
   * // Common angles
   * matrix.rotate(Math.PI / 2);  // 90 degrees
   * matrix.rotate(Math.PI);      // 180 degrees
   * matrix.rotate(Math.PI * 2);  // 360 degrees
   * ```
   * @remarks
   * - Rotates around origin point (0,0)
   * - Affects position if translation was set
   * - Uses counter-clockwise rotation
   * - Order of operations matters when chaining
   * @param angle - The angle in radians
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.setTransform} For setting rotation directly
   * @see {@link Matrix.append} For combining transformations
   */ rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const a1 = this.a;
        const c1 = this.c;
        const tx1 = this.tx;
        this.a = a1 * cos - this.b * sin;
        this.b = a1 * sin + this.b * cos;
        this.c = c1 * cos - this.d * sin;
        this.d = c1 * sin + this.d * cos;
        this.tx = tx1 * cos - this.ty * sin;
        this.ty = tx1 * sin + this.ty * cos;
        return this;
    }
    /**
   * Appends the given Matrix to this Matrix.
   * Combines two matrices by multiplying them together: this = this * matrix
   * @example
   * ```ts
   * // Basic matrix combination
   * const matrix = new Matrix();
   * const other = new Matrix().translate(100, 0).rotate(Math.PI / 4);
   * matrix.append(other);
   * ```
   * @remarks
   * - Order matters: A.append(B) !== B.append(A)
   * - Modifies current matrix
   * - Preserves transformation order
   * - Commonly used for combining transforms
   * @param matrix - The matrix to append
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.prepend} For prepending transformations
   * @see {@link Matrix.appendFrom} For appending two external matrices
   */ append(matrix) {
        const a1 = this.a;
        const b1 = this.b;
        const c1 = this.c;
        const d1 = this.d;
        this.a = matrix.a * a1 + matrix.b * c1;
        this.b = matrix.a * b1 + matrix.b * d1;
        this.c = matrix.c * a1 + matrix.d * c1;
        this.d = matrix.c * b1 + matrix.d * d1;
        this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx;
        this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty;
        return this;
    }
    /**
   * Appends two matrices and sets the result to this matrix.
   * Performs matrix multiplication: this = A * B
   * @example
   * ```ts
   * // Basic matrix multiplication
   * const result = new Matrix();
   * const matrixA = new Matrix().scale(2, 2);
   * const matrixB = new Matrix().rotate(Math.PI / 4);
   * result.appendFrom(matrixA, matrixB);
   * ```
   * @remarks
   * - Order matters: A * B !== B * A
   * - Creates a new transformation from two others
   * - More efficient than append() for multiple operations
   * - Does not modify input matrices
   * @param a - The first matrix to multiply
   * @param b - The second matrix to multiply
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.append} For single matrix combination
   * @see {@link Matrix.prepend} For reverse order multiplication
   */ appendFrom(a, b) {
        const a1 = a.a;
        const b1 = a.b;
        const c1 = a.c;
        const d1 = a.d;
        const tx = a.tx;
        const ty = a.ty;
        const a2 = b.a;
        const b2 = b.b;
        const c2 = b.c;
        const d2 = b.d;
        this.a = a1 * a2 + b1 * c2;
        this.b = a1 * b2 + b1 * d2;
        this.c = c1 * a2 + d1 * c2;
        this.d = c1 * b2 + d1 * d2;
        this.tx = tx * a2 + ty * c2 + b.tx;
        this.ty = tx * b2 + ty * d2 + b.ty;
        return this;
    }
    /**
   * Sets the matrix based on all the available properties.
   * Combines position, scale, rotation, skew and pivot in a single operation.
   * @example
   * ```ts
   * // Basic transform setup
   * const matrix = new Matrix();
   * matrix.setTransform(
   *     100, 100,    // position
   *     0, 0,        // pivot
   *     2, 2,        // scale
   *     Math.PI / 4, // rotation (45 degrees)
   *     0, 0         // skew
   * );
   * ```
   * @remarks
   * - Updates all matrix components at once
   * - More efficient than separate transform calls
   * - Uses radians for rotation and skew
   * - Pivot affects rotation center
   * @param x - Position on the x axis
   * @param y - Position on the y axis
   * @param pivotX - Pivot on the x axis
   * @param pivotY - Pivot on the y axis
   * @param scaleX - Scale on the x axis
   * @param scaleY - Scale on the y axis
   * @param rotation - Rotation in radians
   * @param skewX - Skew on the x axis
   * @param skewY - Skew on the y axis
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.decompose} For extracting transform properties
   * @see {@link TransformableObject} For transform data structure
   */ setTransform(x, y, pivotX, pivotY, scaleX, scaleY, rotation, skewX, skewY) {
        this.a = Math.cos(rotation + skewY) * scaleX;
        this.b = Math.sin(rotation + skewY) * scaleX;
        this.c = -Math.sin(rotation - skewX) * scaleY;
        this.d = Math.cos(rotation - skewX) * scaleY;
        this.tx = x - (pivotX * this.a + pivotY * this.c);
        this.ty = y - (pivotX * this.b + pivotY * this.d);
        return this;
    }
    /**
   * Prepends the given Matrix to this Matrix.
   * Combines two matrices by multiplying them together: this = matrix * this
   * @example
   * ```ts
   * // Basic matrix prepend
   * const matrix = new Matrix().scale(2, 2);
   * const other = new Matrix().translate(100, 0);
   * matrix.prepend(other); // Translation happens before scaling
   * ```
   * @remarks
   * - Order matters: A.prepend(B) !== B.prepend(A)
   * - Modifies current matrix
   * - Reverses transformation order compared to append()
   * @param matrix - The matrix to prepend
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.append} For appending transformations
   * @see {@link Matrix.appendFrom} For combining external matrices
   */ prepend(matrix) {
        const tx1 = this.tx;
        if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
            const a1 = this.a;
            const c1 = this.c;
            this.a = a1 * matrix.a + this.b * matrix.c;
            this.b = a1 * matrix.b + this.b * matrix.d;
            this.c = c1 * matrix.a + this.d * matrix.c;
            this.d = c1 * matrix.b + this.d * matrix.d;
        }
        this.tx = tx1 * matrix.a + this.ty * matrix.c + matrix.tx;
        this.ty = tx1 * matrix.b + this.ty * matrix.d + matrix.ty;
        return this;
    }
    /**
   * Decomposes the matrix into its individual transform components.
   * Extracts position, scale, rotation and skew values from the matrix.
   * @example
   * ```ts
   * // Basic decomposition
   * const matrix = new Matrix()
   *     .translate(100, 100)
   *     .rotate(Math.PI / 4)
   *     .scale(2, 2);
   *
   * const transform = {
   *     position: new Point(),
   *     scale: new Point(),
   *     pivot: new Point(),
   *     skew: new Point(),
   *     rotation: 0
   * };
   *
   * matrix.decompose(transform);
   * console.log(transform.position); // Point(100, 100)
   * console.log(transform.rotation); // ~0.785 (PI/4)
   * console.log(transform.scale); // Point(2, 2)
   * ```
   * @remarks
   * - Handles combined transformations
   * - Accounts for pivot points
   * - Chooses between rotation/skew based on transform type
   * - Uses radians for rotation and skew
   * @param transform - The transform object to store the decomposed values
   * @returns The transform with the newly applied properties
   * @see {@link Matrix.setTransform} For composing from components
   * @see {@link TransformableObject} For transform structure
   */ decompose(transform) {
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        const pivot = transform.pivot;
        const skewX = -Math.atan2(-c, d);
        const skewY = Math.atan2(b, a);
        const delta = Math.abs(skewX + skewY);
        if (delta < 1e-5 || Math.abs(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PI_2"] - delta) < 1e-5) {
            transform.rotation = skewY;
            transform.skew.x = transform.skew.y = 0;
        } else {
            transform.rotation = 0;
            transform.skew.x = skewX;
            transform.skew.y = skewY;
        }
        transform.scale.x = Math.sqrt(a * a + b * b);
        transform.scale.y = Math.sqrt(c * c + d * d);
        transform.position.x = this.tx + (pivot.x * a + pivot.y * c);
        transform.position.y = this.ty + (pivot.x * b + pivot.y * d);
        return transform;
    }
    /**
   * Inverts this matrix.
   * Creates the matrix that when multiplied with this matrix results in an identity matrix.
   * @example
   * ```ts
   * // Basic matrix inversion
   * const matrix = new Matrix()
   *     .translate(100, 50)
   *     .scale(2, 2);
   *
   * matrix.invert(); // Now transforms in opposite direction
   *
   * // Verify inversion
   * const point = new Point(50, 50);
   * const transformed = matrix.apply(point);
   * const original = matrix.invert().apply(transformed);
   * // original ≈ point
   * ```
   * @remarks
   * - Modifies the current matrix
   * - Useful for reversing transformations
   * - Cannot invert matrices with zero determinant
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.identity} For resetting to identity
   * @see {@link Matrix.applyInverse} For inverse transformations
   */ invert() {
        const a1 = this.a;
        const b1 = this.b;
        const c1 = this.c;
        const d1 = this.d;
        const tx1 = this.tx;
        const n = a1 * d1 - b1 * c1;
        this.a = d1 / n;
        this.b = -b1 / n;
        this.c = -c1 / n;
        this.d = a1 / n;
        this.tx = (c1 * this.ty - d1 * tx1) / n;
        this.ty = -(a1 * this.ty - b1 * tx1) / n;
        return this;
    }
    /**
   * Checks if this matrix is an identity matrix.
   *
   * An identity matrix has no transformations applied (default state).
   * @example
   * ```ts
   * // Check if matrix is identity
   * const matrix = new Matrix();
   * console.log(matrix.isIdentity()); // true
   *
   * // Check after transformations
   * matrix.translate(100, 0);
   * console.log(matrix.isIdentity()); // false
   *
   * // Reset and verify
   * matrix.identity();
   * console.log(matrix.isIdentity()); // true
   * ```
   * @remarks
   * - Verifies a = 1, d = 1 (no scale)
   * - Verifies b = 0, c = 0 (no skew)
   * - Verifies tx = 0, ty = 0 (no translation)
   * @returns True if matrix has no transformations
   * @see {@link Matrix.identity} For resetting to identity
   * @see {@link Matrix.IDENTITY} For constant identity matrix
   */ isIdentity() {
        return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0;
    }
    /**
   * Resets this Matrix to an identity (default) matrix.
   * Sets all components to their default values: scale=1, no skew, no translation.
   * @example
   * ```ts
   * // Reset transformed matrix
   * const matrix = new Matrix()
   *     .scale(2, 2)
   *     .rotate(Math.PI / 4);
   * matrix.identity(); // Back to default state
   *
   * // Chain after reset
   * matrix
   *     .identity()
   *     .translate(100, 100)
   *     .scale(2, 2);
   *
   * // Compare with identity constant
   * const isDefault = matrix.equals(Matrix.IDENTITY);
   * ```
   * @remarks
   * - Sets a=1, d=1 (default scale)
   * - Sets b=0, c=0 (no skew)
   * - Sets tx=0, ty=0 (no translation)
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.IDENTITY} For constant identity matrix
   * @see {@link Matrix.isIdentity} For checking identity state
   */ identity() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.tx = 0;
        this.ty = 0;
        return this;
    }
    /**
   * Creates a new Matrix object with the same values as this one.
   * @returns A copy of this matrix. Good for chaining method calls.
   */ clone() {
        const matrix = new Matrix();
        matrix.a = this.a;
        matrix.b = this.b;
        matrix.c = this.c;
        matrix.d = this.d;
        matrix.tx = this.tx;
        matrix.ty = this.ty;
        return matrix;
    }
    /**
   * Creates a new Matrix object with the same values as this one.
   * @param matrix
   * @example
   * ```ts
   * // Basic matrix cloning
   * const matrix = new Matrix()
   *     .translate(100, 100)
   *     .rotate(Math.PI / 4);
   * const copy = matrix.clone();
   *
   * // Clone and modify
   * const modified = matrix.clone()
   *     .scale(2, 2);
   *
   * // Compare matrices
   * console.log(matrix.equals(copy));     // true
   * console.log(matrix.equals(modified)); // false
   * ```
   * @returns A copy of this matrix. Good for chaining method calls.
   * @see {@link Matrix.copyTo} For copying to existing matrix
   * @see {@link Matrix.copyFrom} For copying from another matrix
   */ copyTo(matrix) {
        matrix.a = this.a;
        matrix.b = this.b;
        matrix.c = this.c;
        matrix.d = this.d;
        matrix.tx = this.tx;
        matrix.ty = this.ty;
        return matrix;
    }
    /**
   * Changes the values of the matrix to be the same as the ones in given matrix.
   * @example
   * ```ts
   * // Basic matrix copying
   * const source = new Matrix()
   *     .translate(100, 100)
   *     .rotate(Math.PI / 4);
   * const target = new Matrix();
   * target.copyFrom(source);
   * ```
   * @param matrix - The matrix to copy from
   * @returns This matrix. Good for chaining method calls.
   * @see {@link Matrix.clone} For creating new matrix copy
   * @see {@link Matrix.copyTo} For copying to another matrix
   */ copyFrom(matrix) {
        this.a = matrix.a;
        this.b = matrix.b;
        this.c = matrix.c;
        this.d = matrix.d;
        this.tx = matrix.tx;
        this.ty = matrix.ty;
        return this;
    }
    /**
   * Checks if this matrix equals another matrix.
   * Compares all components for exact equality.
   * @example
   * ```ts
   * // Basic equality check
   * const m1 = new Matrix();
   * const m2 = new Matrix();
   * console.log(m1.equals(m2)); // true
   *
   * // Compare transformed matrices
   * const transform = new Matrix()
   *     .translate(100, 100)
   * const clone = new Matrix()
   *     .scale(2, 2);
   * console.log(transform.equals(clone)); // false
   * ```
   * @param matrix - The matrix to compare to
   * @returns True if matrices are identical
   * @see {@link Matrix.copyFrom} For copying matrix values
   * @see {@link Matrix.isIdentity} For identity comparison
   */ equals(matrix) {
        return matrix.a === this.a && matrix.b === this.b && matrix.c === this.c && matrix.d === this.d && matrix.tx === this.tx && matrix.ty === this.ty;
    }
    toString() {
        return "[pixi.js:Matrix a=".concat(this.a, " b=").concat(this.b, " c=").concat(this.c, " d=").concat(this.d, " tx=").concat(this.tx, " ty=").concat(this.ty, "]");
    }
    /**
   * A default (identity) matrix with no transformations applied.
   *
   * > [!IMPORTANT] This is a shared read-only object. Create a new Matrix if you need to modify it.
   * @example
   * ```ts
   * // Get identity matrix reference
   * const identity = Matrix.IDENTITY;
   * console.log(identity.isIdentity()); // true
   *
   * // Compare with identity
   * const matrix = new Matrix();
   * console.log(matrix.equals(Matrix.IDENTITY)); // true
   *
   * // Create new matrix instead of modifying IDENTITY
   * const transform = new Matrix()
   *     .copyFrom(Matrix.IDENTITY)
   *     .translate(100, 100);
   * ```
   * @readonly
   * @returns A read-only identity matrix
   * @see {@link Matrix.shared} For temporary calculations
   * @see {@link Matrix.identity} For resetting matrices
   */ static get IDENTITY() {
        return identityMatrix.identity();
    }
    /**
   * A static Matrix that can be used to avoid creating new objects.
   * Will always ensure the matrix is reset to identity when requested.
   *
   * > [!IMPORTANT] This matrix is shared and temporary. Do not store references to it.
   * @example
   * ```ts
   * // Use for temporary calculations
   * const tempMatrix = Matrix.shared;
   * tempMatrix.translate(100, 100).rotate(Math.PI / 4);
   * const point = tempMatrix.apply({ x: 10, y: 20 });
   *
   * // Will be reset to identity on next access
   * const fresh = Matrix.shared; // Back to identity
   * ```
   * @remarks
   * - Always returns identity matrix
   * - Safe to modify temporarily
   * - Not safe to store references
   * - Useful for one-off calculations
   * @readonly
   * @returns A fresh identity matrix for temporary use
   * @see {@link Matrix.IDENTITY} For immutable identity matrix
   * @see {@link Matrix.identity} For resetting matrices
   */ static get shared() {
        return tempMatrix.identity();
    }
    /**
   * @param a - x scale
   * @param b - y skew
   * @param c - x skew
   * @param d - y scale
   * @param tx - x translation
   * @param ty - y translation
   */ constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0){
        /**
     * Array representation of the matrix.
     * Only populated when `toArray()` is called.
     * @default null
     * @see {@link Matrix.toArray} For filling this array
     */ this.array = null;
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }
}
const tempMatrix = new Matrix();
const identityMatrix = new Matrix();
;
 //# sourceMappingURL=Matrix.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/groupD8.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "groupD8",
    ()=>groupD8
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
;
"use strict";
const ux = [
    1,
    1,
    0,
    -1,
    -1,
    -1,
    0,
    1,
    1,
    1,
    0,
    -1,
    -1,
    -1,
    0,
    1
];
const uy = [
    0,
    1,
    1,
    1,
    0,
    -1,
    -1,
    -1,
    0,
    1,
    1,
    1,
    0,
    -1,
    -1,
    -1
];
const vx = [
    0,
    -1,
    -1,
    -1,
    0,
    1,
    1,
    1,
    0,
    1,
    1,
    1,
    0,
    -1,
    -1,
    -1
];
const vy = [
    1,
    1,
    0,
    -1,
    -1,
    -1,
    0,
    1,
    -1,
    -1,
    0,
    1,
    1,
    1,
    0,
    -1
];
const rotationCayley = [];
const rotationMatrices = [];
const signum = Math.sign;
function init() {
    for(let i = 0; i < 16; i++){
        const row = [];
        rotationCayley.push(row);
        for(let j = 0; j < 16; j++){
            const _ux = signum(ux[i] * ux[j] + vx[i] * uy[j]);
            const _uy = signum(uy[i] * ux[j] + vy[i] * uy[j]);
            const _vx = signum(ux[i] * vx[j] + vx[i] * vy[j]);
            const _vy = signum(uy[i] * vx[j] + vy[i] * vy[j]);
            for(let k = 0; k < 16; k++){
                if (ux[k] === _ux && uy[k] === _uy && vx[k] === _vx && vy[k] === _vy) {
                    row.push(k);
                    break;
                }
            }
        }
    }
    for(let i = 0; i < 16; i++){
        const mat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
        mat.set(ux[i], uy[i], vx[i], vy[i], 0, 0);
        rotationMatrices.push(mat);
    }
}
init();
const groupD8 = {
    /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 0°       | East      |
   * @group groupD8
   * @type {GD8Symmetry}
   */ E: 0,
    /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 45°↻     | Southeast |
   * @group groupD8
   * @type {GD8Symmetry}
   */ SE: 1,
    /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 90°↻     | South     |
   * @group groupD8
   * @type {GD8Symmetry}
   */ S: 2,
    /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 135°↻    | Southwest |
   * @group groupD8
   * @type {GD8Symmetry}
   */ SW: 3,
    /**
   * | Rotation | Direction |
   * |----------|-----------|
   * | 180°     | West      |
   * @group groupD8
   * @type {GD8Symmetry}
   */ W: 4,
    /**
   * | Rotation    | Direction    |
   * |-------------|--------------|
   * | -135°/225°↻ | Northwest    |
   * @group groupD8
   * @type {GD8Symmetry}
   */ NW: 5,
    /**
   * | Rotation    | Direction    |
   * |-------------|--------------|
   * | -90°/270°↻  | North        |
   * @group groupD8
   * @type {GD8Symmetry}
   */ N: 6,
    /**
   * | Rotation    | Direction    |
   * |-------------|--------------|
   * | -45°/315°↻  | Northeast    |
   * @group groupD8
   * @type {GD8Symmetry}
   */ NE: 7,
    /**
   * Reflection about Y-axis.
   * @group groupD8
   * @type {GD8Symmetry}
   */ MIRROR_VERTICAL: 8,
    /**
   * Reflection about the main diagonal.
   * @group groupD8
   * @type {GD8Symmetry}
   */ MAIN_DIAGONAL: 10,
    /**
   * Reflection about X-axis.
   * @group groupD8
   * @type {GD8Symmetry}
   */ MIRROR_HORIZONTAL: 12,
    /**
   * Reflection about reverse diagonal.
   * @group groupD8
   * @type {GD8Symmetry}
   */ REVERSE_DIAGONAL: 14,
    /**
   * @group groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The X-component of the U-axis
   *    after rotating the axes.
   */ uX: (ind)=>ux[ind],
    /**
   * @group groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The Y-component of the U-axis
   *    after rotating the axes.
   */ uY: (ind)=>uy[ind],
    /**
   * @group groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The X-component of the V-axis
   *    after rotating the axes.
   */ vX: (ind)=>vx[ind],
    /**
   * @group groupD8
   * @param {GD8Symmetry} ind - sprite rotation angle.
   * @returns {GD8Symmetry} The Y-component of the V-axis
   *    after rotating the axes.
   */ vY: (ind)=>vy[ind],
    /**
   * @group groupD8
   * @param {GD8Symmetry} rotation - symmetry whose opposite
   *   is needed. Only rotations have opposite symmetries while
   *   reflections don't.
   * @returns {GD8Symmetry} The opposite symmetry of `rotation`
   */ inv: (rotation)=>{
        if (rotation & 8) {
            return rotation & 15;
        }
        return -rotation & 7;
    },
    /**
   * Composes the two D8 operations.
   *
   * Taking `^` as reflection:
   *
   * |       | E=0 | S=2 | W=4 | N=6 | E^=8 | S^=10 | W^=12 | N^=14 |
   * |-------|-----|-----|-----|-----|------|-------|-------|-------|
   * | E=0   | E   | S   | W   | N   | E^   | S^    | W^    | N^    |
   * | S=2   | S   | W   | N   | E   | S^   | W^    | N^    | E^    |
   * | W=4   | W   | N   | E   | S   | W^   | N^    | E^    | S^    |
   * | N=6   | N   | E   | S   | W   | N^   | E^    | S^    | W^    |
   * | E^=8  | E^  | N^  | W^  | S^  | E    | N     | W     | S     |
   * | S^=10 | S^  | E^  | N^  | W^  | S    | E     | N     | W     |
   * | W^=12 | W^  | S^  | E^  | N^  | W    | S     | E     | N     |
   * | N^=14 | N^  | W^  | S^  | E^  | N    | W     | S     | E     |
   *
   * [This is a Cayley table]{@link https://en.wikipedia.org/wiki/Cayley_table}
   * @group groupD8
   * @param {GD8Symmetry} rotationSecond - Second operation, which
   *   is the row in the above cayley table.
   * @param {GD8Symmetry} rotationFirst - First operation, which
   *   is the column in the above cayley table.
   * @returns {GD8Symmetry} Composed operation
   */ add: (rotationSecond, rotationFirst)=>rotationCayley[rotationSecond][rotationFirst],
    /**
   * Reverse of `add`.
   * @group groupD8
   * @param {GD8Symmetry} rotationSecond - Second operation
   * @param {GD8Symmetry} rotationFirst - First operation
   * @returns {GD8Symmetry} Result
   */ sub: (rotationSecond, rotationFirst)=>rotationCayley[rotationSecond][groupD8.inv(rotationFirst)],
    /**
   * Adds 180 degrees to rotation, which is a commutative
   * operation.
   * @group groupD8
   * @param {number} rotation - The number to rotate.
   * @returns {number} Rotated number
   */ rotate180: (rotation)=>rotation ^ 4,
    /**
   * Checks if the rotation angle is vertical, i.e. south
   * or north. It doesn't work for reflections.
   * @group groupD8
   * @param {GD8Symmetry} rotation - The number to check.
   * @returns {boolean} Whether or not the direction is vertical
   */ isVertical: (rotation)=>(rotation & 3) === 2,
    // rotation % 4 === 2
    /**
   * Approximates the vector `V(dx,dy)` into one of the
   * eight directions provided by `groupD8`.
   * @group groupD8
   * @param {number} dx - X-component of the vector
   * @param {number} dy - Y-component of the vector
   * @returns {GD8Symmetry} Approximation of the vector into
   *  one of the eight symmetries.
   */ byDirection: (dx, dy)=>{
        if (Math.abs(dx) * 2 <= Math.abs(dy)) {
            if (dy >= 0) {
                return groupD8.S;
            }
            return groupD8.N;
        } else if (Math.abs(dy) * 2 <= Math.abs(dx)) {
            if (dx > 0) {
                return groupD8.E;
            }
            return groupD8.W;
        } else if (dy > 0) {
            if (dx > 0) {
                return groupD8.SE;
            }
            return groupD8.SW;
        } else if (dx > 0) {
            return groupD8.NE;
        }
        return groupD8.NW;
    },
    /**
   * Helps sprite to compensate texture packer rotation.
   * @group groupD8
   * @param {Matrix} matrix - sprite world matrix
   * @param {GD8Symmetry} rotation - The rotation factor to use.
   * @param {number} tx - sprite anchoring
   * @param {number} ty - sprite anchoring
   */ matrixAppendRotationInv: function(matrix, rotation) {
        let tx = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0, ty = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
        const mat = rotationMatrices[groupD8.inv(rotation)];
        mat.tx = tx;
        mat.ty = ty;
        matrix.append(mat);
    },
    /**
   * Transforms rectangle coordinates based on texture packer rotation.
   * Used when texture atlas pages are rotated and coordinates need to be adjusted.
   * @group groupD8
   * @param {RectangleLike} rect - Rectangle with original coordinates to transform
   * @param {RectangleLike} sourceFrame - Source texture frame (includes offset and dimensions)
   * @param {GD8Symmetry} rotation - The groupD8 rotation value
   * @param {Rectangle} out - Rectangle to store the result
   * @returns {Rectangle} Transformed coordinates (includes source frame offset)
   */ transformRectCoords: (rect, sourceFrame, rotation, out)=>{
        const { x, y, width, height } = rect;
        const { x: frameX, y: frameY, width: frameWidth, height: frameHeight } = sourceFrame;
        if (rotation === groupD8.E) {
            out.set(x + frameX, y + frameY, width, height);
            return out;
        } else if (rotation === groupD8.S) {
            return out.set(frameWidth - y - height + frameX, x + frameY, height, width);
        } else if (rotation === groupD8.W) {
            return out.set(frameWidth - x - width + frameX, frameHeight - y - height + frameY, width, height);
        } else if (rotation === groupD8.N) {
            return out.set(y + frameX, frameHeight - x - width + frameY, height, width);
        }
        return out.set(x + frameX, y + frameY, width, height);
    }
};
;
 //# sourceMappingURL=groupD8.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Rectangle",
    ()=>Rectangle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/Point.mjs [app-client] (ecmascript)");
;
"use strict";
const tempPoints = [
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"](),
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"](),
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"](),
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"]()
];
class Rectangle {
    /**
   * Returns the left edge (x-coordinate) of the rectangle.
   * @example
   * ```ts
   * // Get left edge position
   * const rect = new Rectangle(100, 100, 200, 150);
   * console.log(rect.left); // 100
   *
   * // Use in alignment calculations
   * sprite.x = rect.left + padding;
   *
   * // Compare positions
   * if (point.x > rect.left) {
   *     console.log('Point is right of rectangle');
   * }
   * ```
   * @readonly
   * @returns The x-coordinate of the left edge
   * @see {@link Rectangle.right} For right edge position
   * @see {@link Rectangle.x} For direct x-coordinate access
   */ get left() {
        return this.x;
    }
    /**
   * Returns the right edge (x + width) of the rectangle.
   * @example
   * ```ts
   * // Get right edge position
   * const rect = new Rectangle(100, 100, 200, 150);
   * console.log(rect.right); // 300
   *
   * // Align to right edge
   * sprite.x = rect.right - sprite.width;
   *
   * // Check boundaries
   * if (point.x < rect.right) {
   *     console.log('Point is inside right bound');
   * }
   * ```
   * @readonly
   * @returns The x-coordinate of the right edge
   * @see {@link Rectangle.left} For left edge position
   * @see {@link Rectangle.width} For width value
   */ get right() {
        return this.x + this.width;
    }
    /**
   * Returns the top edge (y-coordinate) of the rectangle.
   * @example
   * ```ts
   * // Get top edge position
   * const rect = new Rectangle(100, 100, 200, 150);
   * console.log(rect.top); // 100
   *
   * // Position above rectangle
   * sprite.y = rect.top - sprite.height;
   *
   * // Check vertical position
   * if (point.y > rect.top) {
   *     console.log('Point is below top edge');
   * }
   * ```
   * @readonly
   * @returns The y-coordinate of the top edge
   * @see {@link Rectangle.bottom} For bottom edge position
   * @see {@link Rectangle.y} For direct y-coordinate access
   */ get top() {
        return this.y;
    }
    /**
   * Returns the bottom edge (y + height) of the rectangle.
   * @example
   * ```ts
   * // Get bottom edge position
   * const rect = new Rectangle(100, 100, 200, 150);
   * console.log(rect.bottom); // 250
   *
   * // Stack below rectangle
   * sprite.y = rect.bottom + margin;
   *
   * // Check vertical bounds
   * if (point.y < rect.bottom) {
   *     console.log('Point is above bottom edge');
   * }
   * ```
   * @readonly
   * @returns The y-coordinate of the bottom edge
   * @see {@link Rectangle.top} For top edge position
   * @see {@link Rectangle.height} For height value
   */ get bottom() {
        return this.y + this.height;
    }
    /**
   * Determines whether the Rectangle is empty (has no area).
   * @example
   * ```ts
   * // Check zero dimensions
   * const rect = new Rectangle(100, 100, 0, 50);
   * console.log(rect.isEmpty()); // true
   * ```
   * @returns True if the rectangle has no area
   * @see {@link Rectangle.width} For width value
   * @see {@link Rectangle.height} For height value
   */ isEmpty() {
        return this.left === this.right || this.top === this.bottom;
    }
    /**
   * A constant empty rectangle. This is a new object every time the property is accessed.
   * @example
   * ```ts
   * // Get fresh empty rectangle
   * const empty = Rectangle.EMPTY;
   * console.log(empty.isEmpty()); // true
   * ```
   * @returns A new empty rectangle instance
   * @see {@link Rectangle.isEmpty} For empty state testing
   */ static get EMPTY() {
        return new Rectangle(0, 0, 0, 0);
    }
    /**
   * Creates a clone of this Rectangle
   * @example
   * ```ts
   * // Basic cloning
   * const original = new Rectangle(100, 100, 200, 150);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.width *= 2;
   * modified.height += 50;
   *
   * // Verify independence
   * console.log(original.width);  // 200
   * console.log(modified.width);  // 400
   * ```
   * @returns A copy of the rectangle
   * @see {@link Rectangle.copyFrom} For copying into existing rectangle
   * @see {@link Rectangle.copyTo} For copying to another rectangle
   */ clone() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }
    /**
   * Converts a Bounds object to a Rectangle object.
   * @example
   * ```ts
   * // Convert bounds to rectangle
   * const bounds = container.getBounds();
   * const rect = new Rectangle().copyFromBounds(bounds);
   * ```
   * @param bounds - The bounds to copy and convert to a rectangle
   * @returns Returns itself
   * @see {@link Bounds} For bounds object structure
   * @see {@link Rectangle.getBounds} For getting rectangle bounds
   */ copyFromBounds(bounds) {
        this.x = bounds.minX;
        this.y = bounds.minY;
        this.width = bounds.maxX - bounds.minX;
        this.height = bounds.maxY - bounds.minY;
        return this;
    }
    /**
   * Copies another rectangle to this one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Rectangle(100, 100, 200, 150);
   * const target = new Rectangle();
   * target.copyFrom(source);
   *
   * // Chain with other operations
   * const rect = new Rectangle()
   *     .copyFrom(source)
   *     .pad(10);
   * ```
   * @param rectangle - The rectangle to copy from
   * @returns Returns itself
   * @see {@link Rectangle.copyTo} For copying to another rectangle
   * @see {@link Rectangle.clone} For creating new rectangle copy
   */ copyFrom(rectangle) {
        this.x = rectangle.x;
        this.y = rectangle.y;
        this.width = rectangle.width;
        this.height = rectangle.height;
        return this;
    }
    /**
   * Copies this rectangle to another one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Rectangle(100, 100, 200, 150);
   * const target = new Rectangle();
   * source.copyTo(target);
   *
   * // Chain with other operations
   * const result = source
   *     .copyTo(new Rectangle())
   *     .getBounds();
   * ```
   * @param rectangle - The rectangle to copy to
   * @returns Returns given parameter
   * @see {@link Rectangle.copyFrom} For copying from another rectangle
   * @see {@link Rectangle.clone} For creating new rectangle copy
   */ copyTo(rectangle) {
        rectangle.copyFrom(this);
        return rectangle;
    }
    /**
   * Checks whether the x and y coordinates given are contained within this Rectangle
   * @example
   * ```ts
   * // Basic containment check
   * const rect = new Rectangle(100, 100, 200, 150);
   * const isInside = rect.contains(150, 125); // true
   * // Check edge cases
   * console.log(rect.contains(100, 100)); // true (on edge)
   * console.log(rect.contains(300, 250)); // false (outside)
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coordinates are within this Rectangle
   * @see {@link Rectangle.containsRect} For rectangle containment
   * @see {@link Rectangle.strokeContains} For checking stroke intersection
   */ contains(x, y) {
        if (this.width <= 0 || this.height <= 0) {
            return false;
        }
        if (x >= this.x && x < this.x + this.width) {
            if (y >= this.y && y < this.y + this.height) {
                return true;
            }
        }
        return false;
    }
    /**
   * Checks whether the x and y coordinates given are contained within this rectangle including the stroke.
   * @example
   * ```ts
   * // Basic stroke check
   * const rect = new Rectangle(100, 100, 200, 150);
   * const isOnStroke = rect.strokeContains(150, 100, 4); // 4px line width
   *
   * // Check with different alignments
   * const innerStroke = rect.strokeContains(150, 100, 4, 1);   // Inside
   * const centerStroke = rect.strokeContains(150, 100, 4, 0.5); // Centered
   * const outerStroke = rect.strokeContains(150, 100, 4, 0);   // Outside
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke (1 = inner, 0.5 = centered, 0 = outer)
   * @returns Whether the x/y coordinates are within this rectangle's stroke
   * @see {@link Rectangle.contains} For checking fill containment
   * @see {@link Rectangle.getBounds} For getting stroke bounds
   */ strokeContains(x, y, strokeWidth) {
        let alignment = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0.5;
        const { width, height } = this;
        if (width <= 0 || height <= 0) return false;
        const _x = this.x;
        const _y = this.y;
        const strokeWidthOuter = strokeWidth * (1 - alignment);
        const strokeWidthInner = strokeWidth - strokeWidthOuter;
        const outerLeft = _x - strokeWidthOuter;
        const outerRight = _x + width + strokeWidthOuter;
        const outerTop = _y - strokeWidthOuter;
        const outerBottom = _y + height + strokeWidthOuter;
        const innerLeft = _x + strokeWidthInner;
        const innerRight = _x + width - strokeWidthInner;
        const innerTop = _y + strokeWidthInner;
        const innerBottom = _y + height - strokeWidthInner;
        return x >= outerLeft && x <= outerRight && y >= outerTop && y <= outerBottom && !(x > innerLeft && x < innerRight && y > innerTop && y < innerBottom);
    }
    /**
   * Determines whether the `other` Rectangle transformed by `transform` intersects with `this` Rectangle object.
   * Returns true only if the area of the intersection is >0, this means that Rectangles
   * sharing a side are not overlapping. Another side effect is that an arealess rectangle
   * (width or height equal to zero) can't intersect any other rectangle.
   * @param {Rectangle} other - The Rectangle to intersect with `this`.
   * @param {Matrix} transform - The transformation matrix of `other`.
   * @returns {boolean} A value of `true` if the transformed `other` Rectangle intersects with `this`; otherwise `false`.
   */ /**
   * Determines whether the `other` Rectangle transformed by `transform` intersects with `this` Rectangle object.
   *
   * Returns true only if the area of the intersection is greater than 0.
   * This means that rectangles sharing only a side are not considered intersecting.
   * @example
   * ```ts
   * // Basic intersection check
   * const rect1 = new Rectangle(0, 0, 100, 100);
   * const rect2 = new Rectangle(50, 50, 100, 100);
   * console.log(rect1.intersects(rect2)); // true
   *
   * // With transformation matrix
   * const matrix = new Matrix();
   * matrix.rotate(Math.PI / 4); // 45 degrees
   * console.log(rect1.intersects(rect2, matrix)); // Checks with rotation
   *
   * // Edge cases
   * const zeroWidth = new Rectangle(0, 0, 0, 100);
   * console.log(rect1.intersects(zeroWidth)); // false (no area)
   * ```
   * @remarks
   * - Returns true only if intersection area is > 0
   * - Rectangles sharing only a side are not intersecting
   * - Zero-area rectangles cannot intersect anything
   * - Supports optional transformation matrix
   * @param other - The Rectangle to intersect with `this`
   * @param transform - Optional transformation matrix of `other`
   * @returns True if the transformed `other` Rectangle intersects with `this`
   * @see {@link Rectangle.containsRect} For containment testing
   * @see {@link Rectangle.contains} For point testing
   */ intersects(other, transform) {
        if (!transform) {
            const x02 = this.x < other.x ? other.x : this.x;
            const x12 = this.right > other.right ? other.right : this.right;
            if (x12 <= x02) {
                return false;
            }
            const y02 = this.y < other.y ? other.y : this.y;
            const y12 = this.bottom > other.bottom ? other.bottom : this.bottom;
            return y12 > y02;
        }
        const x0 = this.left;
        const x1 = this.right;
        const y0 = this.top;
        const y1 = this.bottom;
        if (x1 <= x0 || y1 <= y0) {
            return false;
        }
        const lt = tempPoints[0].set(other.left, other.top);
        const lb = tempPoints[1].set(other.left, other.bottom);
        const rt = tempPoints[2].set(other.right, other.top);
        const rb = tempPoints[3].set(other.right, other.bottom);
        if (rt.x <= lt.x || lb.y <= lt.y) {
            return false;
        }
        const s = Math.sign(transform.a * transform.d - transform.b * transform.c);
        if (s === 0) {
            return false;
        }
        transform.apply(lt, lt);
        transform.apply(lb, lb);
        transform.apply(rt, rt);
        transform.apply(rb, rb);
        if (Math.max(lt.x, lb.x, rt.x, rb.x) <= x0 || Math.min(lt.x, lb.x, rt.x, rb.x) >= x1 || Math.max(lt.y, lb.y, rt.y, rb.y) <= y0 || Math.min(lt.y, lb.y, rt.y, rb.y) >= y1) {
            return false;
        }
        const nx = s * (lb.y - lt.y);
        const ny = s * (lt.x - lb.x);
        const n00 = nx * x0 + ny * y0;
        const n10 = nx * x1 + ny * y0;
        const n01 = nx * x0 + ny * y1;
        const n11 = nx * x1 + ny * y1;
        if (Math.max(n00, n10, n01, n11) <= nx * lt.x + ny * lt.y || Math.min(n00, n10, n01, n11) >= nx * rb.x + ny * rb.y) {
            return false;
        }
        const mx = s * (lt.y - rt.y);
        const my = s * (rt.x - lt.x);
        const m00 = mx * x0 + my * y0;
        const m10 = mx * x1 + my * y0;
        const m01 = mx * x0 + my * y1;
        const m11 = mx * x1 + my * y1;
        if (Math.max(m00, m10, m01, m11) <= mx * lt.x + my * lt.y || Math.min(m00, m10, m01, m11) >= mx * rb.x + my * rb.y) {
            return false;
        }
        return true;
    }
    /**
   * Pads the rectangle making it grow in all directions.
   *
   * If paddingY is omitted, both paddingX and paddingY will be set to paddingX.
   * @example
   * ```ts
   * // Basic padding
   * const rect = new Rectangle(100, 100, 200, 150);
   * rect.pad(10); // Adds 10px padding on all sides
   *
   * // Different horizontal and vertical padding
   * const uiRect = new Rectangle(0, 0, 100, 50);
   * uiRect.pad(20, 10); // 20px horizontal, 10px vertical
   * ```
   * @remarks
   * - Adjusts x/y by subtracting padding
   * - Increases width/height by padding * 2
   * - Common in UI layout calculations
   * - Chainable with other methods
   * @param paddingX - The horizontal padding amount
   * @param paddingY - The vertical padding amount
   * @returns Returns itself
   * @see {@link Rectangle.enlarge} For growing to include another rectangle
   * @see {@link Rectangle.fit} For shrinking to fit within another rectangle
   */ pad() {
        let paddingX = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0, paddingY = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : paddingX;
        this.x -= paddingX;
        this.y -= paddingY;
        this.width += paddingX * 2;
        this.height += paddingY * 2;
        return this;
    }
    /**
   * Fits this rectangle around the passed one.
   * @example
   * ```ts
   * // Basic fitting
   * const container = new Rectangle(0, 0, 100, 100);
   * const content = new Rectangle(25, 25, 200, 200);
   * content.fit(container); // Clips to container bounds
   * ```
   * @param rectangle - The rectangle to fit around
   * @returns Returns itself
   * @see {@link Rectangle.enlarge} For growing to include another rectangle
   * @see {@link Rectangle.pad} For adding padding around the rectangle
   */ fit(rectangle) {
        const x1 = Math.max(this.x, rectangle.x);
        const x2 = Math.min(this.x + this.width, rectangle.x + rectangle.width);
        const y1 = Math.max(this.y, rectangle.y);
        const y2 = Math.min(this.y + this.height, rectangle.y + rectangle.height);
        this.x = x1;
        this.width = Math.max(x2 - x1, 0);
        this.y = y1;
        this.height = Math.max(y2 - y1, 0);
        return this;
    }
    /**
   * Enlarges rectangle so that its corners lie on a grid defined by resolution.
   * @example
   * ```ts
   * // Basic grid alignment
   * const rect = new Rectangle(10.2, 10.6, 100.8, 100.4);
   * rect.ceil(); // Aligns to whole pixels
   *
   * // Custom resolution grid
   * const uiRect = new Rectangle(5.3, 5.7, 50.2, 50.8);
   * uiRect.ceil(0.5); // Aligns to half pixels
   *
   * // Use with precision value
   * const preciseRect = new Rectangle(20.001, 20.999, 100.001, 100.999);
   * preciseRect.ceil(1, 0.01); // Handles small decimal variations
   * ```
   * @param resolution - The grid size to align to (1 = whole pixels)
   * @param eps - Small number to prevent floating point errors
   * @returns Returns itself
   * @see {@link Rectangle.fit} For constraining to bounds
   * @see {@link Rectangle.enlarge} For growing dimensions
   */ ceil() {
        let resolution = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1, eps = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1e-3;
        const x2 = Math.ceil((this.x + this.width - eps) * resolution) / resolution;
        const y2 = Math.ceil((this.y + this.height - eps) * resolution) / resolution;
        this.x = Math.floor((this.x + eps) * resolution) / resolution;
        this.y = Math.floor((this.y + eps) * resolution) / resolution;
        this.width = x2 - this.x;
        this.height = y2 - this.y;
        return this;
    }
    /**
   * Scales the rectangle's dimensions and position by the specified factors.
   * @example
   * ```ts
   * const rect = new Rectangle(50, 50, 100, 100);
   *
   * // Scale uniformly
   * rect.scale(0.5, 0.5);
   * // rect is now: x=25, y=25, width=50, height=50
   *
   * // non-uniformly
   * rect.scale(0.5, 1);
   * // rect is now: x=25, y=50, width=50, height=100
   * ```
   * @param x - The factor by which to scale the horizontal properties (x, width).
   * @param y - The factor by which to scale the vertical properties (y, height).
   * @returns Returns itself
   */ scale(x) {
        let y = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : x;
        this.x *= x;
        this.y *= y;
        this.width *= x;
        this.height *= y;
        return this;
    }
    /**
   * Enlarges this rectangle to include the passed rectangle.
   * @example
   * ```ts
   * // Basic enlargement
   * const rect = new Rectangle(50, 50, 100, 100);
   * const other = new Rectangle(0, 0, 200, 75);
   * rect.enlarge(other);
   * // rect is now: x=0, y=0, width=200, height=150
   *
   * // Use for bounding box calculation
   * const bounds = new Rectangle();
   * objects.forEach((obj) => {
   *     bounds.enlarge(obj.getBounds());
   * });
   * ```
   * @param rectangle - The rectangle to include
   * @returns Returns itself
   * @see {@link Rectangle.fit} For shrinking to fit within another rectangle
   * @see {@link Rectangle.pad} For adding padding around the rectangle
   */ enlarge(rectangle) {
        const x1 = Math.min(this.x, rectangle.x);
        const x2 = Math.max(this.x + this.width, rectangle.x + rectangle.width);
        const y1 = Math.min(this.y, rectangle.y);
        const y2 = Math.max(this.y + this.height, rectangle.y + rectangle.height);
        this.x = x1;
        this.width = x2 - x1;
        this.y = y1;
        this.height = y2 - y1;
        return this;
    }
    /**
   * Returns the framing rectangle of the rectangle as a Rectangle object
   * @example
   * ```ts
   * // Basic bounds retrieval
   * const rect = new Rectangle(100, 100, 200, 150);
   * const bounds = rect.getBounds();
   *
   * // Reuse existing rectangle
   * const out = new Rectangle();
   * rect.getBounds(out);
   * ```
   * @param out - Optional rectangle to store the result
   * @returns The framing rectangle
   * @see {@link Rectangle.copyFrom} For direct copying
   * @see {@link Rectangle.clone} For creating new copy
   */ getBounds(out) {
        out || (out = new Rectangle());
        out.copyFrom(this);
        return out;
    }
    /**
   * Determines whether another Rectangle is fully contained within this Rectangle.
   *
   * Rectangles that occupy the same space are considered to be containing each other.
   *
   * Rectangles without area (width or height equal to zero) can't contain anything,
   * not even other arealess rectangles.
   * @example
   * ```ts
   * // Check if one rectangle contains another
   * const container = new Rectangle(0, 0, 100, 100);
   * const inner = new Rectangle(25, 25, 50, 50);
   *
   * console.log(container.containsRect(inner)); // true
   *
   * // Check overlapping rectangles
   * const partial = new Rectangle(75, 75, 50, 50);
   * console.log(container.containsRect(partial)); // false
   *
   * // Zero-area rectangles
   * const empty = new Rectangle(0, 0, 0, 100);
   * console.log(container.containsRect(empty)); // false
   * ```
   * @param other - The Rectangle to check for containment
   * @returns True if other is fully contained within this Rectangle
   * @see {@link Rectangle.contains} For point containment
   * @see {@link Rectangle.intersects} For overlap testing
   */ containsRect(other) {
        if (this.width <= 0 || this.height <= 0) return false;
        const x1 = other.x;
        const y1 = other.y;
        const x2 = other.x + other.width;
        const y2 = other.y + other.height;
        return x1 >= this.x && x1 < this.x + this.width && y1 >= this.y && y1 < this.y + this.height && x2 >= this.x && x2 < this.x + this.width && y2 >= this.y && y2 < this.y + this.height;
    }
    /**
   * Sets the position and dimensions of the rectangle.
   * @example
   * ```ts
   * // Basic usage
   * const rect = new Rectangle();
   * rect.set(100, 100, 200, 150);
   *
   * // Chain with other operations
   * const bounds = new Rectangle()
   *     .set(0, 0, 100, 100)
   *     .pad(10);
   * ```
   * @param x - The X coordinate of the upper-left corner of the rectangle
   * @param y - The Y coordinate of the upper-left corner of the rectangle
   * @param width - The overall width of the rectangle
   * @param height - The overall height of the rectangle
   * @returns Returns itself for method chaining
   * @see {@link Rectangle.copyFrom} For copying from another rectangle
   * @see {@link Rectangle.clone} For creating a new copy
   */ set(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        return this;
    }
    toString() {
        return "[pixi.js/math:Rectangle x=".concat(this.x, " y=").concat(this.y, " width=").concat(this.width, " height=").concat(this.height, "]");
    }
    /**
   * @param x - The X coordinate of the upper-left corner of the rectangle
   * @param y - The Y coordinate of the upper-left corner of the rectangle
   * @param width - The overall width of the rectangle
   * @param height - The overall height of the rectangle
   */ constructor(x = 0, y = 0, width = 0, height = 0){
        /**
     * The type of the object, mainly used to avoid `instanceof` checks
     * @example
     * ```ts
     * // Check shape type
     * const shape = new Rectangle(0, 0, 100, 100);
     * console.log(shape.type); // 'rectangle'
     *
     * // Use in type guards
     * if (shape.type === 'rectangle') {
     *     console.log(shape.width, shape.height);
     * }
     * ```
     * @readonly
     * @default 'rectangle'
     * @see {@link SHAPE_PRIMITIVE} For all shape types
     */ this.type = "rectangle";
        this.x = Number(x);
        this.y = Number(y);
        this.width = Number(width);
        this.height = Number(height);
    }
}
;
 //# sourceMappingURL=Rectangle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/misc/pow2.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isPow2",
    ()=>isPow2,
    "log2",
    ()=>log2,
    "nextPow2",
    ()=>nextPow2
]);
"use strict";
function nextPow2(v) {
    v += v === 0 ? 1 : 0;
    --v;
    v |= v >>> 1;
    v |= v >>> 2;
    v |= v >>> 4;
    v |= v >>> 8;
    v |= v >>> 16;
    return v + 1;
}
function isPow2(v) {
    return !(v & v - 1) && !!v;
}
function log2(v) {
    let r = (v > 65535 ? 1 : 0) << 4;
    v >>>= r;
    let shift = (v > 255 ? 1 : 0) << 3;
    v >>>= shift;
    r |= shift;
    shift = (v > 15 ? 1 : 0) << 2;
    v >>>= shift;
    r |= shift;
    shift = (v > 3 ? 1 : 0) << 1;
    v >>>= shift;
    r |= shift;
    return r | v >> 1;
}
;
 //# sourceMappingURL=pow2.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Circle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Circle",
    ()=>Circle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
;
"use strict";
class Circle {
    /**
   * Creates a clone of this Circle instance.
   * @example
   * ```ts
   * // Basic circle cloning
   * const original = new Circle(100, 100, 50);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.radius = 75;
   *
   * // Verify independence
   * console.log(original.radius); // 50
   * console.log(modified.radius); // 75
   * ```
   * @returns A copy of the Circle
   * @see {@link Circle.copyFrom} For copying into existing circle
   * @see {@link Circle.copyTo} For copying to another circle
   */ clone() {
        return new Circle(this.x, this.y, this.radius);
    }
    /**
   * Checks whether the x and y coordinates given are contained within this circle.
   *
   * Uses the distance formula to determine if a point is inside the circle's radius.
   *
   * Commonly used for hit testing in PixiJS events and graphics.
   * @example
   * ```ts
   * // Basic containment check
   * const circle = new Circle(100, 100, 50);
   * const isInside = circle.contains(120, 120);
   *
   * // Check mouse position
   * const circle = new Circle(0, 0, 100);
   * container.hitArea = circle;
   * container.on('pointermove', (e) => {
   *     // only called if pointer is within circle
   * });
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coordinates are within this Circle
   * @see {@link Circle.strokeContains} For checking stroke intersection
   * @see {@link Circle.getBounds} For getting bounding box
   */ contains(x, y) {
        if (this.radius <= 0) return false;
        const r2 = this.radius * this.radius;
        let dx = this.x - x;
        let dy = this.y - y;
        dx *= dx;
        dy *= dy;
        return dx + dy <= r2;
    }
    /**
   * Checks whether the x and y coordinates given are contained within this circle including the stroke.
   * @example
   * ```ts
   * // Basic stroke check
   * const circle = new Circle(100, 100, 50);
   * const isOnStroke = circle.strokeContains(150, 100, 4); // 4px line width
   *
   * // Check with different alignments
   * const innerStroke = circle.strokeContains(150, 100, 4, 1);   // Inside
   * const centerStroke = circle.strokeContains(150, 100, 4, 0.5); // Centered
   * const outerStroke = circle.strokeContains(150, 100, 4, 0);   // Outside
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param width - The width of the line to check
   * @param alignment - The alignment of the stroke, 0.5 by default
   * @returns Whether the x/y coordinates are within this Circle's stroke
   * @see {@link Circle.contains} For checking fill containment
   * @see {@link Circle.getBounds} For getting stroke bounds
   */ strokeContains(x, y, width) {
        let alignment = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0.5;
        if (this.radius === 0) return false;
        const dx = this.x - x;
        const dy = this.y - y;
        const radius = this.radius;
        const outerWidth = (1 - alignment) * width;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= radius + outerWidth && distance > radius - (width - outerWidth);
    }
    /**
   * Returns the framing rectangle of the circle as a Rectangle object.
   * @example
   * ```ts
   * // Basic bounds calculation
   * const circle = new Circle(100, 100, 50);
   * const bounds = circle.getBounds();
   * // bounds: x=50, y=50, width=100, height=100
   *
   * // Reuse existing rectangle
   * const rect = new Rectangle();
   * circle.getBounds(rect);
   * ```
   * @param out - Optional Rectangle object to store the result
   * @returns The framing rectangle
   * @see {@link Rectangle} For rectangle properties
   * @see {@link Circle.contains} For point containment
   */ getBounds(out) {
        out || (out = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"]());
        out.x = this.x - this.radius;
        out.y = this.y - this.radius;
        out.width = this.radius * 2;
        out.height = this.radius * 2;
        return out;
    }
    /**
   * Copies another circle to this one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Circle(100, 100, 50);
   * const target = new Circle();
   * target.copyFrom(source);
   * ```
   * @param circle - The circle to copy from
   * @returns Returns itself
   * @see {@link Circle.copyTo} For copying to another circle
   * @see {@link Circle.clone} For creating new circle copy
   */ copyFrom(circle) {
        this.x = circle.x;
        this.y = circle.y;
        this.radius = circle.radius;
        return this;
    }
    /**
   * Copies this circle to another one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Circle(100, 100, 50);
   * const target = new Circle();
   * source.copyTo(target);
   * ```
   * @param circle - The circle to copy to
   * @returns Returns given parameter
   * @see {@link Circle.copyFrom} For copying from another circle
   * @see {@link Circle.clone} For creating new circle copy
   */ copyTo(circle) {
        circle.copyFrom(this);
        return circle;
    }
    toString() {
        return "[pixi.js/math:Circle x=".concat(this.x, " y=").concat(this.y, " radius=").concat(this.radius, "]");
    }
    /**
   * @param x - The X coordinate of the center of this circle
   * @param y - The Y coordinate of the center of this circle
   * @param radius - The radius of the circle
   */ constructor(x = 0, y = 0, radius = 0){
        /**
     * The type of the object, mainly used to avoid `instanceof` checks.
     * @example
     * ```ts
     * // Check shape type
     * const shape = new Circle(0, 0, 50);
     * console.log(shape.type); // 'circle'
     *
     * // Use in type guards
     * if (shape.type === 'circle') {
     *     console.log(shape.radius);
     * }
     * ```
     * @remarks
     * - Used for shape type checking
     * - More efficient than instanceof
     * - Read-only property
     * @readonly
     * @default 'circle'
     * @see {@link SHAPE_PRIMITIVE} For all shape types
     * @see {@link ShapePrimitive} For shape interface
     */ this.type = "circle";
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
}
;
 //# sourceMappingURL=Circle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Ellipse.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Ellipse",
    ()=>Ellipse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
;
"use strict";
class Ellipse {
    /**
   * Creates a clone of this Ellipse instance.
   * @example
   * ```ts
   * // Basic cloning
   * const original = new Ellipse(100, 100, 50, 25);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.halfWidth *= 2;
   * modified.halfHeight *= 2;
   *
   * // Verify independence
   * console.log(original.halfWidth);  // 50
   * console.log(modified.halfWidth);  // 100
   * ```
   * @returns A copy of the ellipse
   * @see {@link Ellipse.copyFrom} For copying into existing ellipse
   * @see {@link Ellipse.copyTo} For copying to another ellipse
   */ clone() {
        return new Ellipse(this.x, this.y, this.halfWidth, this.halfHeight);
    }
    /**
   * Checks whether the x and y coordinates given are contained within this ellipse.
   * Uses normalized coordinates and the ellipse equation to determine containment.
   * @example
   * ```ts
   * // Basic containment check
   * const ellipse = new Ellipse(100, 100, 50, 25);
   * const isInside = ellipse.contains(120, 110);
   * ```
   * @remarks
   * - Uses ellipse equation (x²/a² + y²/b² ≤ 1)
   * - Returns false if dimensions are 0 or negative
   * - Normalized to center (0,0) for calculation
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coords are within this ellipse
   * @see {@link Ellipse.strokeContains} For checking stroke intersection
   * @see {@link Ellipse.getBounds} For getting containing rectangle
   */ contains(x, y) {
        if (this.halfWidth <= 0 || this.halfHeight <= 0) {
            return false;
        }
        let normx = (x - this.x) / this.halfWidth;
        let normy = (y - this.y) / this.halfHeight;
        normx *= normx;
        normy *= normy;
        return normx + normy <= 1;
    }
    /**
   * Checks whether the x and y coordinates given are contained within this ellipse including stroke.
   * @example
   * ```ts
   * // Basic stroke check
   * const ellipse = new Ellipse(100, 100, 50, 25);
   * const isOnStroke = ellipse.strokeContains(150, 100, 4); // 4px line width
   *
   * // Check with different alignments
   * const innerStroke = ellipse.strokeContains(150, 100, 4, 1);   // Inside
   * const centerStroke = ellipse.strokeContains(150, 100, 4, 0.5); // Centered
   * const outerStroke = ellipse.strokeContains(150, 100, 4, 0);   // Outside
   * ```
   * @remarks
   * - Uses normalized ellipse equations
   * - Considers stroke alignment
   * - Returns false if dimensions are 0
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke (1 = inner, 0.5 = centered, 0 = outer)
   * @returns Whether the x/y coords are within this ellipse's stroke
   * @see {@link Ellipse.contains} For checking fill containment
   * @see {@link Ellipse.getBounds} For getting stroke bounds
   */ strokeContains(x, y, strokeWidth) {
        let alignment = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0.5;
        const { halfWidth, halfHeight } = this;
        if (halfWidth <= 0 || halfHeight <= 0) {
            return false;
        }
        const strokeOuterWidth = strokeWidth * (1 - alignment);
        const strokeInnerWidth = strokeWidth - strokeOuterWidth;
        const innerHorizontal = halfWidth - strokeInnerWidth;
        const innerVertical = halfHeight - strokeInnerWidth;
        const outerHorizontal = halfWidth + strokeOuterWidth;
        const outerVertical = halfHeight + strokeOuterWidth;
        const normalizedX = x - this.x;
        const normalizedY = y - this.y;
        const innerEllipse = normalizedX * normalizedX / (innerHorizontal * innerHorizontal) + normalizedY * normalizedY / (innerVertical * innerVertical);
        const outerEllipse = normalizedX * normalizedX / (outerHorizontal * outerHorizontal) + normalizedY * normalizedY / (outerVertical * outerVertical);
        return innerEllipse > 1 && outerEllipse <= 1;
    }
    /**
   * Returns the framing rectangle of the ellipse as a Rectangle object.
   * @example
   * ```ts
   * // Basic bounds calculation
   * const ellipse = new Ellipse(100, 100, 50, 25);
   * const bounds = ellipse.getBounds();
   * // bounds: x=50, y=75, width=100, height=50
   *
   * // Reuse existing rectangle
   * const rect = new Rectangle();
   * ellipse.getBounds(rect);
   * ```
   * @remarks
   * - Creates Rectangle if none provided
   * - Top-left is (x-halfWidth, y-halfHeight)
   * - Width is halfWidth * 2
   * - Height is halfHeight * 2
   * @param out - Optional Rectangle object to store the result
   * @returns The framing rectangle
   * @see {@link Rectangle} For rectangle properties
   * @see {@link Ellipse.contains} For checking if a point is inside
   */ getBounds(out) {
        out || (out = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"]());
        out.x = this.x - this.halfWidth;
        out.y = this.y - this.halfHeight;
        out.width = this.halfWidth * 2;
        out.height = this.halfHeight * 2;
        return out;
    }
    /**
   * Copies another ellipse to this one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Ellipse(100, 100, 50, 25);
   * const target = new Ellipse();
   * target.copyFrom(source);
   * ```
   * @param ellipse - The ellipse to copy from
   * @returns Returns itself
   * @see {@link Ellipse.copyTo} For copying to another ellipse
   * @see {@link Ellipse.clone} For creating new ellipse copy
   */ copyFrom(ellipse) {
        this.x = ellipse.x;
        this.y = ellipse.y;
        this.halfWidth = ellipse.halfWidth;
        this.halfHeight = ellipse.halfHeight;
        return this;
    }
    /**
   * Copies this ellipse to another one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Ellipse(100, 100, 50, 25);
   * const target = new Ellipse();
   * source.copyTo(target);
   * ```
   * @param ellipse - The ellipse to copy to
   * @returns Returns given parameter
   * @see {@link Ellipse.copyFrom} For copying from another ellipse
   * @see {@link Ellipse.clone} For creating new ellipse copy
   */ copyTo(ellipse) {
        ellipse.copyFrom(this);
        return ellipse;
    }
    toString() {
        return "[pixi.js/math:Ellipse x=".concat(this.x, " y=").concat(this.y, " halfWidth=").concat(this.halfWidth, " halfHeight=").concat(this.halfHeight, "]");
    }
    /**
   * @param x - The X coordinate of the center of this ellipse
   * @param y - The Y coordinate of the center of this ellipse
   * @param halfWidth - The half width of this ellipse
   * @param halfHeight - The half height of this ellipse
   */ constructor(x = 0, y = 0, halfWidth = 0, halfHeight = 0){
        /**
     * The type of the object, mainly used to avoid `instanceof` checks
     * @example
     * ```ts
     * // Check shape type
     * const shape = new Ellipse(0, 0, 50, 25);
     * console.log(shape.type); // 'ellipse'
     *
     * // Use in type guards
     * if (shape.type === 'ellipse') {
     *     console.log(shape.halfWidth, shape.halfHeight);
     * }
     * ```
     * @readonly
     * @default 'ellipse'
     * @see {@link SHAPE_PRIMITIVE} For all shape types
     */ this.type = "ellipse";
        this.x = x;
        this.y = y;
        this.halfWidth = halfWidth;
        this.halfHeight = halfHeight;
    }
}
;
 //# sourceMappingURL=Ellipse.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/misc/squaredDistanceToLineSegment.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "squaredDistanceToLineSegment",
    ()=>squaredDistanceToLineSegment
]);
"use strict";
function squaredDistanceToLineSegment(x, y, x1, y1, x2, y2) {
    const a = x - x1;
    const b = y - y1;
    const c = x2 - x1;
    const d = y2 - y1;
    const dot = a * c + b * d;
    const lenSq = c * c + d * d;
    let param = -1;
    if (lenSq !== 0) {
        param = dot / lenSq;
    }
    let xx;
    let yy;
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * c;
        yy = y1 + param * d;
    }
    const dx = x - xx;
    const dy = y - yy;
    return dx * dx + dy * dy;
}
;
 //# sourceMappingURL=squaredDistanceToLineSegment.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Polygon.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Polygon",
    ()=>Polygon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$squaredDistanceToLineSegment$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/misc/squaredDistanceToLineSegment.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
let tempRect;
let tempRect2;
class Polygon {
    /**
   * Determines whether the polygon's points are arranged in a clockwise direction.
   * Uses the shoelace formula (surveyor's formula) to calculate the signed area.
   *
   * A positive area indicates clockwise winding, while negative indicates counter-clockwise.
   *
   * The formula sums up the cross products of adjacent vertices:
   * For each pair of adjacent points (x1,y1) and (x2,y2), we calculate (x1*y2 - x2*y1)
   * The final sum divided by 2 gives the signed area - positive for clockwise.
   * @example
   * ```ts
   * // Check polygon winding
   * const polygon = new Polygon([0, 0, 100, 0, 50, 100]);
   * console.log(polygon.isClockwise()); // Check direction
   *
   * // Use in path construction
   * const hole = new Polygon([25, 25, 75, 25, 75, 75, 25, 75]);
   * if (hole.isClockwise() === shape.isClockwise()) {
   *     hole.points.reverse(); // Reverse for proper hole winding
   * }
   * ```
   * @returns `true` if the polygon's points are arranged clockwise, `false` if counter-clockwise
   */ isClockwise() {
        let area = 0;
        const points = this.points;
        const length = points.length;
        for(let i = 0; i < length; i += 2){
            const x1 = points[i];
            const y1 = points[i + 1];
            const x2 = points[(i + 2) % length];
            const y2 = points[(i + 3) % length];
            area += (x2 - x1) * (y2 + y1);
        }
        return area < 0;
    }
    /**
   * Checks if this polygon completely contains another polygon.
   * Used for detecting holes in shapes, like when parsing SVG paths.
   * @example
   * ```ts
   * // Basic containment check
   * const outerSquare = new Polygon([0,0, 100,0, 100,100, 0,100]); // A square
   * const innerSquare = new Polygon([25,25, 75,25, 75,75, 25,75]); // A smaller square inside
   *
   * outerSquare.containsPolygon(innerSquare); // Returns true
   * innerSquare.containsPolygon(outerSquare); // Returns false
   * ```
   * @remarks
   * - Uses bounds check for quick rejection
   * - Tests all points for containment
   * @param polygon - The polygon to test for containment
   * @returns True if this polygon completely contains the other polygon
   * @see {@link Polygon.contains} For single point testing
   * @see {@link Polygon.getBounds} For bounds calculation
   */ containsPolygon(polygon) {
        const thisBounds = this.getBounds(tempRect);
        const otherBounds = polygon.getBounds(tempRect2);
        if (!thisBounds.containsRect(otherBounds)) {
            return false;
        }
        const points = polygon.points;
        for(let i = 0; i < points.length; i += 2){
            const x = points[i];
            const y = points[i + 1];
            if (!this.contains(x, y)) {
                return false;
            }
        }
        return true;
    }
    /**
   * Creates a clone of this polygon.
   * @example
   * ```ts
   * // Basic cloning
   * const original = new Polygon([0, 0, 100, 0, 50, 100]);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.points[0] = 10; // Modify first x coordinate
   * ```
   * @returns A copy of the polygon
   * @see {@link Polygon.copyFrom} For copying into existing polygon
   * @see {@link Polygon.copyTo} For copying to another polygon
   */ clone() {
        const points = this.points.slice();
        const polygon = new Polygon(points);
        polygon.closePath = this.closePath;
        return polygon;
    }
    /**
   * Checks whether the x and y coordinates passed to this function are contained within this polygon.
   * Uses raycasting algorithm for point-in-polygon testing.
   * @example
   * ```ts
   * // Basic containment check
   * const polygon = new Polygon([0, 0, 100, 0, 50, 100]);
   * const isInside = polygon.contains(25, 25); // true
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coordinates are within this polygon
   * @see {@link Polygon.strokeContains} For checking stroke intersection
   * @see {@link Polygon.containsPolygon} For polygon-in-polygon testing
   */ contains(x, y) {
        let inside = false;
        const length = this.points.length / 2;
        for(let i = 0, j = length - 1; i < length; j = i++){
            const xi = this.points[i * 2];
            const yi = this.points[i * 2 + 1];
            const xj = this.points[j * 2];
            const yj = this.points[j * 2 + 1];
            const intersect = yi > y !== yj > y && x < (xj - xi) * ((y - yi) / (yj - yi)) + xi;
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    }
    /**
   * Checks whether the x and y coordinates given are contained within this polygon including the stroke.
   * @example
   * ```ts
   * // Basic stroke check
   * const polygon = new Polygon([0, 0, 100, 0, 50, 100]);
   * const isOnStroke = polygon.strokeContains(25, 25, 4); // 4px line width
   *
   * // Check with different alignments
   * const innerStroke = polygon.strokeContains(25, 25, 4, 1);   // Inside
   * const centerStroke = polygon.strokeContains(25, 25, 4, 0.5); // Centered
   * const outerStroke = polygon.strokeContains(25, 25, 4, 0);   // Outside
   * ```
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke (1 = inner, 0.5 = centered, 0 = outer)
   * @returns Whether the x/y coordinates are within this polygon's stroke
   * @see {@link Polygon.contains} For checking fill containment
   * @see {@link Polygon.getBounds} For getting stroke bounds
   */ strokeContains(x, y, strokeWidth) {
        let alignment = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0.5;
        const strokeWidthSquared = strokeWidth * strokeWidth;
        const rightWidthSquared = strokeWidthSquared * (1 - alignment);
        const leftWidthSquared = strokeWidthSquared - rightWidthSquared;
        const { points } = this;
        const iterationLength = points.length - (this.closePath ? 0 : 2);
        for(let i = 0; i < iterationLength; i += 2){
            const x1 = points[i];
            const y1 = points[i + 1];
            const x2 = points[(i + 2) % points.length];
            const y2 = points[(i + 3) % points.length];
            const distanceSquared = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$squaredDistanceToLineSegment$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["squaredDistanceToLineSegment"])(x, y, x1, y1, x2, y2);
            const sign = Math.sign((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1));
            if (distanceSquared <= (sign < 0 ? leftWidthSquared : rightWidthSquared)) {
                return true;
            }
        }
        return false;
    }
    /**
   * Returns the framing rectangle of the polygon as a Rectangle object.
   * @example
   * ```ts
   * // Basic bounds calculation
   * const polygon = new Polygon([0, 0, 100, 0, 50, 100]);
   * const bounds = polygon.getBounds();
   * // bounds: x=0, y=0, width=100, height=100
   *
   * // Reuse existing rectangle
   * const rect = new Rectangle();
   * polygon.getBounds(rect);
   * ```
   * @param out - Optional rectangle to store the result
   * @returns The framing rectangle
   * @see {@link Rectangle} For rectangle properties
   * @see {@link Polygon.contains} For checking if a point is inside
   */ getBounds(out) {
        out || (out = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"]());
        const points = this.points;
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for(let i = 0, n = points.length; i < n; i += 2){
            const x = points[i];
            const y = points[i + 1];
            minX = x < minX ? x : minX;
            maxX = x > maxX ? x : maxX;
            minY = y < minY ? y : minY;
            maxY = y > maxY ? y : maxY;
        }
        out.x = minX;
        out.width = maxX - minX;
        out.y = minY;
        out.height = maxY - minY;
        return out;
    }
    /**
   * Copies another polygon to this one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Polygon([0, 0, 100, 0, 50, 100]);
   * const target = new Polygon();
   * target.copyFrom(source);
   * ```
   * @param polygon - The polygon to copy from
   * @returns Returns itself
   * @see {@link Polygon.copyTo} For copying to another polygon
   * @see {@link Polygon.clone} For creating new polygon copy
   */ copyFrom(polygon) {
        this.points = polygon.points.slice();
        this.closePath = polygon.closePath;
        return this;
    }
    /**
   * Copies this polygon to another one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new Polygon([0, 0, 100, 0, 50, 100]);
   * const target = new Polygon();
   * source.copyTo(target);
   * ```
   * @param polygon - The polygon to copy to
   * @returns Returns given parameter
   * @see {@link Polygon.copyFrom} For copying from another polygon
   * @see {@link Polygon.clone} For creating new polygon copy
   */ copyTo(polygon) {
        polygon.copyFrom(this);
        return polygon;
    }
    toString() {
        return "[pixi.js/math:PolygoncloseStroke=".concat(this.closePath, "points=").concat(this.points.reduce((pointsDesc, currentPoint)=>"".concat(pointsDesc, ", ").concat(currentPoint), ""), "]");
    }
    /**
   * Get the last X coordinate of the polygon.
   * @example
   * ```ts
   * // Basic coordinate access
   * const polygon = new Polygon([0, 0, 100, 200, 300, 400]);
   * console.log(polygon.lastX); // 300
   * ```
   * @readonly
   * @returns The x-coordinate of the last vertex
   * @see {@link Polygon.lastY} For last Y coordinate
   * @see {@link Polygon.points} For raw points array
   */ get lastX() {
        return this.points[this.points.length - 2];
    }
    /**
   * Get the last Y coordinate of the polygon.
   * @example
   * ```ts
   * // Basic coordinate access
   * const polygon = new Polygon([0, 0, 100, 200, 300, 400]);
   * console.log(polygon.lastY); // 400
   * ```
   * @readonly
   * @returns The y-coordinate of the last vertex
   * @see {@link Polygon.lastX} For last X coordinate
   * @see {@link Polygon.points} For raw points array
   */ get lastY() {
        return this.points[this.points.length - 1];
    }
    /**
   * Get the last X coordinate of the polygon.
   * @readonly
   * @deprecated since 8.11.0, use {@link Polygon.lastX} instead.
   */ get x() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])("8.11.0", "Polygon.lastX is deprecated, please use Polygon.lastX instead.");
        return this.points[this.points.length - 2];
    }
    /**
   * Get the last Y coordinate of the polygon.
   * @readonly
   * @deprecated since 8.11.0, use {@link Polygon.lastY} instead.
   */ get y() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])("8.11.0", "Polygon.y is deprecated, please use Polygon.lastY instead.");
        return this.points[this.points.length - 1];
    }
    /**
   * Get the first X coordinate of the polygon.
   * @example
   * ```ts
   * // Basic coordinate access
   * const polygon = new Polygon([0, 0, 100, 200, 300, 400]);
   * console.log(polygon.x); // 0
   * ```
   * @readonly
   * @returns The x-coordinate of the first vertex
   * @see {@link Polygon.startY} For first Y coordinate
   * @see {@link Polygon.points} For raw points array
   */ get startX() {
        return this.points[0];
    }
    /**
   * Get the first Y coordinate of the polygon.
   * @example
   * ```ts
   * // Basic coordinate access
   * const polygon = new Polygon([0, 0, 100, 200, 300, 400]);
   * console.log(polygon.y); // 0
   * ```
   * @readonly
   * @returns The y-coordinate of the first vertex
   * @see {@link Polygon.startX} For first X coordinate
   * @see {@link Polygon.points} For raw points array
   */ get startY() {
        return this.points[1];
    }
    /**
   * @param points - This can be an array of Points
   *  that form the polygon, a flat array of numbers that will be interpreted as [x,y, x,y, ...], or
   *  the arguments passed can be all the points of the polygon e.g.
   *  `new Polygon(new Point(), new Point(), ...)`, or the arguments passed can be flat
   *  x,y values e.g. `new Polygon(x,y, x,y, x,y, ...)` where `x` and `y` are Numbers.
   */ constructor(...points){
        /**
     * The type of the object, mainly used to avoid `instanceof` checks
     * @example
     * ```ts
     * // Check shape type
     * const shape = new Polygon([0, 0, 100, 0, 50, 100]);
     * console.log(shape.type); // 'polygon'
     *
     * // Use in type guards
     * if (shape.type === 'polygon') {
     *     // TypeScript knows this is a Polygon
     *     console.log(shape.points.length);
     * }
     * ```
     * @readonly
     * @default 'polygon'
     * @see {@link SHAPE_PRIMITIVE} For all shape types
     */ this.type = "polygon";
        let flat = Array.isArray(points[0]) ? points[0] : points;
        if (typeof flat[0] !== "number") {
            const p = [];
            for(let i = 0, il = flat.length; i < il; i++){
                p.push(flat[i].x, flat[i].y);
            }
            flat = p;
        }
        this.points = flat;
        this.closePath = true;
    }
}
;
 //# sourceMappingURL=Polygon.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/RoundedRectangle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RoundedRectangle",
    ()=>RoundedRectangle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
;
"use strict";
const isCornerWithinStroke = (pX, pY, cornerX, cornerY, radius, strokeWidthInner, strokeWidthOuter)=>{
    const dx = pX - cornerX;
    const dy = pY - cornerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance >= radius - strokeWidthInner && distance <= radius + strokeWidthOuter;
};
class RoundedRectangle {
    /**
   * Returns the framing rectangle of the rounded rectangle as a Rectangle object
   * @example
   * ```ts
   * // Basic bounds calculation
   * const rect = new RoundedRectangle(100, 100, 200, 150, 20);
   * const bounds = rect.getBounds();
   * // bounds: x=100, y=100, width=200, height=150
   *
   * // Reuse existing rectangle
   * const out = new Rectangle();
   * rect.getBounds(out);
   * ```
   * @remarks
   * - Rectangle matches outer dimensions
   * - Ignores corner radius
   * @param out - Optional rectangle to store the result
   * @returns The framing rectangle
   * @see {@link Rectangle} For rectangle properties
   * @see {@link RoundedRectangle.contains} For checking if a point is inside
   */ getBounds(out) {
        out || (out = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"]());
        out.x = this.x;
        out.y = this.y;
        out.width = this.width;
        out.height = this.height;
        return out;
    }
    /**
   * Creates a clone of this Rounded Rectangle.
   * @example
   * ```ts
   * // Basic cloning
   * const original = new RoundedRectangle(100, 100, 200, 150, 20);
   * const copy = original.clone();
   *
   * // Clone and modify
   * const modified = original.clone();
   * modified.radius = 30;
   * modified.width *= 2;
   *
   * // Verify independence
   * console.log(original.radius);  // 20
   * console.log(modified.radius);  // 30
   * ```
   * @returns A copy of the rounded rectangle
   * @see {@link RoundedRectangle.copyFrom} For copying into existing rectangle
   * @see {@link RoundedRectangle.copyTo} For copying to another rectangle
   */ clone() {
        return new RoundedRectangle(this.x, this.y, this.width, this.height, this.radius);
    }
    /**
   * Copies another rectangle to this one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new RoundedRectangle(100, 100, 200, 150, 20);
   * const target = new RoundedRectangle();
   * target.copyFrom(source);
   *
   * // Chain with other operations
   * const rect = new RoundedRectangle()
   *     .copyFrom(source)
   *     .getBounds(rect);
   * ```
   * @param rectangle - The rectangle to copy from
   * @returns Returns itself
   * @see {@link RoundedRectangle.copyTo} For copying to another rectangle
   * @see {@link RoundedRectangle.clone} For creating new rectangle copy
   */ copyFrom(rectangle) {
        this.x = rectangle.x;
        this.y = rectangle.y;
        this.width = rectangle.width;
        this.height = rectangle.height;
        return this;
    }
    /**
   * Copies this rectangle to another one.
   * @example
   * ```ts
   * // Basic copying
   * const source = new RoundedRectangle(100, 100, 200, 150, 20);
   * const target = new RoundedRectangle();
   * source.copyTo(target);
   *
   * // Chain with other operations
   * const result = source
   *     .copyTo(new RoundedRectangle())
   *     .getBounds();
   * ```
   * @param rectangle - The rectangle to copy to
   * @returns Returns given parameter
   * @see {@link RoundedRectangle.copyFrom} For copying from another rectangle
   * @see {@link RoundedRectangle.clone} For creating new rectangle copy
   */ copyTo(rectangle) {
        rectangle.copyFrom(this);
        return rectangle;
    }
    /**
   * Checks whether the x and y coordinates given are contained within this Rounded Rectangle
   * @example
   * ```ts
   * // Basic containment check
   * const rect = new RoundedRectangle(100, 100, 200, 150, 20);
   * const isInside = rect.contains(150, 125); // true
   * // Check corner radius
   * const corner = rect.contains(100, 100); // false if within corner curve
   * ```
   * @remarks
   * - Returns false if width/height is 0 or negative
   * - Handles rounded corners with radius check
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coordinates are within this Rounded Rectangle
   * @see {@link RoundedRectangle.strokeContains} For checking stroke intersection
   * @see {@link RoundedRectangle.getBounds} For getting containing rectangle
   */ contains(x, y) {
        if (this.width <= 0 || this.height <= 0) {
            return false;
        }
        if (x >= this.x && x <= this.x + this.width) {
            if (y >= this.y && y <= this.y + this.height) {
                const radius = Math.max(0, Math.min(this.radius, Math.min(this.width, this.height) / 2));
                if (y >= this.y + radius && y <= this.y + this.height - radius || x >= this.x + radius && x <= this.x + this.width - radius) {
                    return true;
                }
                let dx = x - (this.x + radius);
                let dy = y - (this.y + radius);
                const radius2 = radius * radius;
                if (dx * dx + dy * dy <= radius2) {
                    return true;
                }
                dx = x - (this.x + this.width - radius);
                if (dx * dx + dy * dy <= radius2) {
                    return true;
                }
                dy = y - (this.y + this.height - radius);
                if (dx * dx + dy * dy <= radius2) {
                    return true;
                }
                dx = x - (this.x + radius);
                if (dx * dx + dy * dy <= radius2) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
   * Checks whether the x and y coordinates given are contained within this rectangle including the stroke.
   * @example
   * ```ts
   * // Basic stroke check
   * const rect = new RoundedRectangle(100, 100, 200, 150, 20);
   * const isOnStroke = rect.strokeContains(150, 100, 4); // 4px line width
   *
   * // Check with different alignments
   * const innerStroke = rect.strokeContains(150, 100, 4, 1);   // Inside
   * const centerStroke = rect.strokeContains(150, 100, 4, 0.5); // Centered
   * const outerStroke = rect.strokeContains(150, 100, 4, 0);   // Outside
   * ```
   * @param pX - The X coordinate of the point to test
   * @param pY - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @param alignment - The alignment of the stroke (1 = inner, 0.5 = centered, 0 = outer)
   * @returns Whether the x/y coordinates are within this rectangle's stroke
   * @see {@link RoundedRectangle.contains} For checking fill containment
   * @see {@link RoundedRectangle.getBounds} For getting stroke bounds
   */ strokeContains(pX, pY, strokeWidth) {
        let alignment = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0.5;
        const { x, y, width, height, radius } = this;
        const strokeWidthOuter = strokeWidth * (1 - alignment);
        const strokeWidthInner = strokeWidth - strokeWidthOuter;
        const innerX = x + radius;
        const innerY = y + radius;
        const innerWidth = width - radius * 2;
        const innerHeight = height - radius * 2;
        const rightBound = x + width;
        const bottomBound = y + height;
        if ((pX >= x - strokeWidthOuter && pX <= x + strokeWidthInner || pX >= rightBound - strokeWidthInner && pX <= rightBound + strokeWidthOuter) && pY >= innerY && pY <= innerY + innerHeight) {
            return true;
        }
        if ((pY >= y - strokeWidthOuter && pY <= y + strokeWidthInner || pY >= bottomBound - strokeWidthInner && pY <= bottomBound + strokeWidthOuter) && pX >= innerX && pX <= innerX + innerWidth) {
            return true;
        }
        return(// Top-left
        pX < innerX && pY < innerY && isCornerWithinStroke(pX, pY, innerX, innerY, radius, strokeWidthInner, strokeWidthOuter) || pX > rightBound - radius && pY < innerY && isCornerWithinStroke(pX, pY, rightBound - radius, innerY, radius, strokeWidthInner, strokeWidthOuter) || pX > rightBound - radius && pY > bottomBound - radius && isCornerWithinStroke(pX, pY, rightBound - radius, bottomBound - radius, radius, strokeWidthInner, strokeWidthOuter) || pX < innerX && pY > bottomBound - radius && isCornerWithinStroke(pX, pY, innerX, bottomBound - radius, radius, strokeWidthInner, strokeWidthOuter));
    }
    toString() {
        return "[pixi.js/math:RoundedRectangle x=".concat(this.x, " y=").concat(this.y, "width=").concat(this.width, " height=").concat(this.height, " radius=").concat(this.radius, "]");
    }
    /**
   * @param x - The X coordinate of the upper-left corner of the rounded rectangle
   * @param y - The Y coordinate of the upper-left corner of the rounded rectangle
   * @param width - The overall width of this rounded rectangle
   * @param height - The overall height of this rounded rectangle
   * @param radius - Controls the radius of the rounded corners
   */ constructor(x = 0, y = 0, width = 0, height = 0, radius = 20){
        /**
     * The type of the object, mainly used to avoid `instanceof` checks
     * @example
     * ```ts
     * // Check shape type
     * const shape = new RoundedRectangle(0, 0, 100, 100, 20);
     * console.log(shape.type); // 'roundedRectangle'
     *
     * // Use in type guards
     * if (shape.type === 'roundedRectangle') {
     *     console.log(shape.radius);
     * }
     * ```
     * @readonly
     * @default 'roundedRectangle'
     * @see {@link SHAPE_PRIMITIVE} For all shape types
     */ this.type = "roundedRectangle";
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.radius = radius;
    }
}
;
 //# sourceMappingURL=RoundedRectangle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resetUids",
    ()=>resetUids,
    "uid",
    ()=>uid
]);
"use strict";
const uidCache = {
    default: -1
};
function uid() {
    let name = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "default";
    if (uidCache[name] === void 0) {
        uidCache[name] = -1;
    }
    return ++uidCache[name];
}
function resetUids() {
    for(const key in uidCache){
        delete uidCache[key];
    }
}
;
 //# sourceMappingURL=uid.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deprecation",
    ()=>deprecation,
    "v8_0_0",
    ()=>v8_0_0,
    "v8_3_4",
    ()=>v8_3_4
]);
"use strict";
const warnings = /* @__PURE__ */ new Set();
const v8_0_0 = "8.0.0";
const v8_3_4 = "8.3.4";
const deprecationState = {
    quiet: false,
    noColor: false
};
const deprecation = function(version, message) {
    let ignoreDepth = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 3;
    if (deprecationState.quiet || warnings.has(message)) return;
    let stack = new Error().stack;
    const deprecationMessage = "".concat(message, "\nDeprecated since v").concat(version);
    const useGroup = typeof console.groupCollapsed === "function" && !deprecationState.noColor;
    if (typeof stack === "undefined") {
        console.warn("PixiJS Deprecation Warning: ", deprecationMessage);
    } else {
        stack = stack.split("\n").splice(ignoreDepth).join("\n");
        if (useGroup) {
            console.groupCollapsed("%cPixiJS Deprecation Warning: %c%s", "color:#614108;background:#fffbe6", "font-weight:normal;color:#614108;background:#fffbe6", deprecationMessage);
            console.warn(stack);
            console.groupEnd();
        } else {
            console.warn("PixiJS Deprecation Warning: ", deprecationMessage);
            console.warn(stack);
        }
    }
    warnings.add(message);
};
Object.defineProperties(deprecation, {
    quiet: {
        get: ()=>deprecationState.quiet,
        set: (value)=>{
            deprecationState.quiet = value;
        },
        enumerable: true,
        configurable: false
    },
    noColor: {
        get: ()=>deprecationState.noColor,
        set: (value)=>{
            deprecationState.noColor = value;
        },
        enumerable: true,
        configurable: false
    }
});
;
 //# sourceMappingURL=deprecation.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/misc/NOOP.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NOOP",
    ()=>NOOP
]);
"use strict";
const NOOP = ()=>{};
;
 //# sourceMappingURL=NOOP.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/updateQuadBounds.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "updateQuadBounds",
    ()=>updateQuadBounds
]);
"use strict";
function updateQuadBounds(bounds, anchor, texture) {
    const { width, height } = texture.orig;
    const trim = texture.trim;
    if (trim) {
        const sourceWidth = trim.width;
        const sourceHeight = trim.height;
        bounds.minX = trim.x - anchor._x * width;
        bounds.maxX = bounds.minX + sourceWidth;
        bounds.minY = trim.y - anchor._y * height;
        bounds.maxY = bounds.minY + sourceHeight;
    } else {
        bounds.minX = -anchor._x * width;
        bounds.maxX = bounds.minX + width;
        bounds.minY = -anchor._y * height;
        bounds.maxY = bounds.minY + height;
    }
}
;
 //# sourceMappingURL=updateQuadBounds.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "warn",
    ()=>warn
]);
"use strict";
let warnCount = 0;
const maxWarnings = 500;
function warn() {
    for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
        args[_key] = arguments[_key];
    }
    if (warnCount === maxWarnings) return;
    warnCount++;
    if (warnCount === maxWarnings) {
        console.warn("PixiJS Warning: too many warnings, no more warnings will be reported to the console by PixiJS.");
    } else {
        console.warn("PixiJS Warning: ", ...args);
    }
}
;
 //# sourceMappingURL=warn.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/GlobalResourceRegistry.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlobalResourceRegistry",
    ()=>GlobalResourceRegistry
]);
"use strict";
const GlobalResourceRegistry = {
    /**
   * Set of registered pools and cleanable objects.
   * @private
   */ _registeredResources: /* @__PURE__ */ new Set(),
    /**
   * Registers a pool or cleanable object for cleanup.
   * @param {Cleanable} pool - The pool or object to register.
   */ register (pool) {
        this._registeredResources.add(pool);
    },
    /**
   * Unregisters a pool or cleanable object from cleanup.
   * @param {Cleanable} pool - The pool or object to unregister.
   */ unregister (pool) {
        this._registeredResources.delete(pool);
    },
    /** Clears all registered pools and cleanable objects. This will call clear() on each registered item. */ release () {
        this._registeredResources.forEach((pool)=>pool.clear());
    },
    /**
   * Gets the number of registered pools and cleanable objects.
   * @returns {number} The count of registered items.
   */ get registeredCount () {
        return this._registeredResources.size;
    },
    /**
   * Checks if a specific pool or cleanable object is registered.
   * @param {Cleanable} pool - The pool or object to check.
   * @returns {boolean} True if the item is registered, false otherwise.
   */ isRegistered (pool) {
        return this._registeredResources.has(pool);
    },
    /**
   * Removes all registrations without clearing the pools.
   * Useful if you want to reset the collector without affecting the pools.
   */ reset () {
        this._registeredResources.clear();
    }
};
;
 //# sourceMappingURL=GlobalResourceRegistry.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/Pool.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Pool",
    ()=>Pool
]);
"use strict";
class Pool {
    /**
   * Prepopulates the pool with a given number of items.
   * @param total - The number of items to add to the pool.
   */ prepopulate(total) {
        for(let i = 0; i < total; i++){
            this._pool[this._index++] = new this._classType();
        }
        this._count += total;
    }
    /**
   * Gets an item from the pool. Calls the item's `init` method if it exists.
   * If there are no items left in the pool, a new one will be created.
   * @param {unknown} [data] - Optional data to pass to the item's constructor.
   * @returns {T} The item from the pool.
   */ get(data) {
        var _item_init;
        let item;
        if (this._index > 0) {
            item = this._pool[--this._index];
        } else {
            item = new this._classType();
        }
        (_item_init = item.init) === null || _item_init === void 0 ? void 0 : _item_init.call(item, data);
        return item;
    }
    /**
   * Returns an item to the pool. Calls the item's `reset` method if it exists.
   * @param {T} item - The item to return to the pool.
   */ return(item) {
        var _item_reset;
        (_item_reset = item.reset) === null || _item_reset === void 0 ? void 0 : _item_reset.call(item);
        this._pool[this._index++] = item;
    }
    /**
   * Gets the number of items in the pool.
   * @readonly
   */ get totalSize() {
        return this._count;
    }
    /**
   * Gets the number of items in the pool that are free to use without needing to create more.
   * @readonly
   */ get totalFree() {
        return this._index;
    }
    /**
   * Gets the number of items in the pool that are currently in use.
   * @readonly
   */ get totalUsed() {
        return this._count - this._index;
    }
    /** clears the pool */ clear() {
        if (this._pool.length > 0 && this._pool[0].destroy) {
            for(let i = 0; i < this._index; i++){
                this._pool[i].destroy();
            }
        }
        this._pool.length = 0;
        this._count = 0;
        this._index = 0;
    }
    /**
   * Constructs a new Pool.
   * @param ClassType - The constructor of the items in the pool.
   * @param {number} [initialSize] - The initial size of the pool.
   */ constructor(ClassType, initialSize){
        this._pool = [];
        this._count = 0;
        this._index = 0;
        this._classType = ClassType;
        if (initialSize) {
            this.prepopulate(initialSize);
        }
    }
}
;
 //# sourceMappingURL=Pool.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BigPool",
    ()=>BigPool,
    "PoolGroupClass",
    ()=>PoolGroupClass
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/GlobalResourceRegistry.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$Pool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/Pool.mjs [app-client] (ecmascript)");
;
;
"use strict";
class PoolGroupClass {
    /**
   * Prepopulates a specific pool with a given number of items.
   * @template T The type of items in the pool. Must extend PoolItem.
   * @param {PoolItemConstructor<T>} Class - The constructor of the items in the pool.
   * @param {number} total - The number of items to add to the pool.
   */ prepopulate(Class, total) {
        const classPool = this.getPool(Class);
        classPool.prepopulate(total);
    }
    /**
   * Gets an item from a specific pool.
   * @template T The type of items in the pool. Must extend PoolItem.
   * @param {PoolItemConstructor<T>} Class - The constructor of the items in the pool.
   * @param {unknown} [data] - Optional data to pass to the item's constructor.
   * @returns {T} The item from the pool.
   */ get(Class, data) {
        const pool = this.getPool(Class);
        return pool.get(data);
    }
    /**
   * Returns an item to its respective pool.
   * @param {PoolItem} item - The item to return to the pool.
   */ return(item) {
        const pool = this.getPool(item.constructor);
        pool.return(item);
    }
    /**
   * Gets a specific pool based on the class type.
   * @template T The type of items in the pool. Must extend PoolItem.
   * @param {PoolItemConstructor<T>} ClassType - The constructor of the items in the pool.
   * @returns {Pool<T>} The pool of the given class type.
   */ getPool(ClassType) {
        if (!this._poolsByClass.has(ClassType)) {
            this._poolsByClass.set(ClassType, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$Pool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Pool"](ClassType));
        }
        return this._poolsByClass.get(ClassType);
    }
    /** gets the usage stats of each pool in the system */ stats() {
        const stats = {};
        this._poolsByClass.forEach((pool)=>{
            const name = stats[pool._classType.name] ? pool._classType.name + pool._classType.ID : pool._classType.name;
            stats[name] = {
                free: pool.totalFree,
                used: pool.totalUsed,
                size: pool.totalSize
            };
        });
        return stats;
    }
    /** Clears all pools in the group. This will reset all pools and free their resources. */ clear() {
        this._poolsByClass.forEach((pool)=>pool.clear());
        this._poolsByClass.clear();
    }
    constructor(){
        /**
     * A map to store the pools by their class type.
     * @private
     */ this._poolsByClass = /* @__PURE__ */ new Map();
    }
}
const BigPool = new PoolGroupClass();
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GlobalResourceRegistry"].register(BigPool);
;
 //# sourceMappingURL=PoolGroup.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/removeItems.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "removeItems",
    ()=>removeItems
]);
"use strict";
function removeItems(arr, startIdx, removeCount) {
    const length = arr.length;
    let i;
    if (startIdx >= length || removeCount === 0) {
        return;
    }
    removeCount = startIdx + removeCount > length ? length - startIdx : removeCount;
    const len = length - removeCount;
    for(i = startIdx; i < len; ++i){
        arr[i] = arr[i + removeCount];
    }
    arr.length = len;
}
;
 //# sourceMappingURL=removeItems.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/detectVideoAlphaMode.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectVideoAlphaMode",
    ()=>detectVideoAlphaMode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)");
;
"use strict";
let promise;
async function detectVideoAlphaMode() {
    promise !== null && promise !== void 0 ? promise : promise = (async ()=>{
        var _gl_getExtension;
        const canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas(1, 1);
        const gl = canvas.getContext("webgl");
        if (!gl) {
            return "premultiply-alpha-on-upload";
        }
        const video = await new Promise((resolve)=>{
            const video2 = document.createElement("video");
            video2.onloadeddata = ()=>resolve(video2);
            video2.onerror = ()=>resolve(null);
            video2.autoplay = false;
            video2.crossOrigin = "anonymous";
            video2.preload = "auto";
            video2.src = "data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHGTbuMU6uEElTDZ1OsggEXTbuMU6uEHFO7a1OsggG97AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmoCrXsYMPQkBNgIRMYXZmV0GETGF2ZkSJiEBEAAAAAAAAFlSua8yuAQAAAAAAAEPXgQFzxYgAAAAAAAAAAZyBACK1nIN1bmSIgQCGhVZfVlA5g4EBI+ODhAJiWgDglLCBArqBApqBAlPAgQFVsIRVuYEBElTDZ9Vzc9JjwItjxYgAAAAAAAAAAWfInEWjh0VOQ09ERVJEh49MYXZjIGxpYnZweC12cDlnyKJFo4hEVVJBVElPTkSHlDAwOjAwOjAwLjA0MDAwMDAwMAAAH0O2dcfngQCgwqGggQAAAIJJg0IAABAAFgA4JBwYSgAAICAAEb///4r+AAB1oZ2mm+6BAaWWgkmDQgAAEAAWADgkHBhKAAAgIABIQBxTu2uRu4+zgQC3iveBAfGCAXHwgQM=";
            video2.load();
        });
        if (!video) {
            return "premultiply-alpha-on-upload";
        }
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        const pixel = new Uint8Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        gl.deleteFramebuffer(framebuffer);
        gl.deleteTexture(texture);
        (_gl_getExtension = gl.getExtension("WEBGL_lose_context")) === null || _gl_getExtension === void 0 ? void 0 : _gl_getExtension.loseContext();
        return pixel[0] <= pixel[3] ? "premultiplied-alpha" : "premultiply-alpha-on-upload";
    })();
    return promise;
}
;
 //# sourceMappingURL=detectVideoAlphaMode.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/path.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "path",
    ()=>path
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)");
;
"use strict";
function assertPath(path2) {
    if (typeof path2 !== "string") {
        throw new TypeError("Path must be a string. Received ".concat(JSON.stringify(path2)));
    }
}
function removeUrlParams(url) {
    const re = url.split("?")[0];
    return re.split("#")[0];
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}
function normalizeStringPosix(path2, allowAboveRoot) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code = -1;
    for(let i = 0; i <= path2.length; ++i){
        if (i < path2.length) {
            code = path2.charCodeAt(i);
        } else if (code === 47) {
            break;
        } else {
            code = 47;
        }
        if (code === 47) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf("/");
                        if (lastSlashIndex !== res.length - 1) {
                            if (lastSlashIndex === -1) {
                                res = "";
                                lastSegmentLength = 0;
                            } else {
                                res = res.slice(0, lastSlashIndex);
                                lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
                            }
                            lastSlash = i;
                            dots = 0;
                            continue;
                        }
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) {
                        res += "/..";
                    } else {
                        res = "..";
                    }
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) {
                    res += "/".concat(path2.slice(lastSlash + 1, i));
                } else {
                    res = path2.slice(lastSlash + 1, i);
                }
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
const path = {
    /**
   * Converts a path to posix format.
   * @param path - The path to convert to posix
   * @example
   * ```ts
   * // Convert a Windows path to POSIX format
   * path.toPosix('C:\\Users\\User\\Documents\\file.txt');
   * // -> 'C:/Users/User/Documents/file.txt'
   * ```
   */ toPosix (path2) {
        return replaceAll(path2, "\\", "/");
    },
    /**
   * Checks if the path is a URL e.g. http://, https://
   * @param path - The path to check
   * @example
   * ```ts
   * // Check if a path is a URL
   * path.isUrl('http://www.example.com');
   * // -> true
   * path.isUrl('C:/Users/User/Documents/file.txt');
   * // -> false
   * ```
   */ isUrl (path2) {
        return /^https?:/.test(this.toPosix(path2));
    },
    /**
   * Checks if the path is a data URL
   * @param path - The path to check
   * @example
   * ```ts
   * // Check if a path is a data URL
   * path.isDataUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...');
   * // -> true
   * ```
   */ isDataUrl (path2) {
        return /^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}()_|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s<>]*?)$/i.test(path2);
    },
    /**
   * Checks if the path is a blob URL
   * @param path - The path to check
   * @example
   * ```ts
   * // Check if a path is a blob URL
   * path.isBlobUrl('blob:http://www.example.com/12345678-1234-1234-1234-123456789012');
   * // -> true
   * ```
   */ isBlobUrl (path2) {
        return path2.startsWith("blob:");
    },
    /**
   * Checks if the path has a protocol e.g. http://, https://, file:///, data:, blob:, C:/
   * This will return true for windows file paths
   * @param path - The path to check
   * @example
   * ```ts
   * // Check if a path has a protocol
   * path.hasProtocol('http://www.example.com');
   * // -> true
   * path.hasProtocol('C:/Users/User/Documents/file.txt');
   * // -> true
   * ```
   */ hasProtocol (path2) {
        return /^[^/:]+:/.test(this.toPosix(path2));
    },
    /**
   * Returns the protocol of the path e.g. http://, https://, file:///, data:, blob:, C:/
   * @param path - The path to get the protocol from
   * @example
   * ```ts
   * // Get the protocol from a URL
   * path.getProtocol('http://www.example.com/path/to/resource');
   * // -> 'http://'
   * // Get the protocol from a file path
   * path.getProtocol('C:/Users/User/Documents/file.txt');
   * // -> 'C:/'
   * ```
   */ getProtocol (path2) {
        assertPath(path2);
        path2 = this.toPosix(path2);
        const matchFile = /^file:\/\/\//.exec(path2);
        if (matchFile) {
            return matchFile[0];
        }
        const matchProtocol = /^[^/:]+:\/{0,2}/.exec(path2);
        if (matchProtocol) {
            return matchProtocol[0];
        }
        return "";
    },
    /**
   * Converts URL to an absolute path.
   * When loading from a Web Worker, we must use absolute paths.
   * If the URL is already absolute we return it as is
   * If it's not, we convert it
   * @param url - The URL to test
   * @param customBaseUrl - The base URL to use
   * @param customRootUrl - The root URL to use
   * @example
   * ```ts
   * // Convert a relative URL to an absolute path
   * path.toAbsolute('images/texture.png', 'http://example.com/assets/');
   * // -> 'http://example.com/assets/images/texture.png'
   * ```
   */ toAbsolute (url, customBaseUrl, customRootUrl) {
        assertPath(url);
        if (this.isDataUrl(url) || this.isBlobUrl(url)) return url;
        const baseUrl = removeUrlParams(this.toPosix(customBaseUrl !== null && customBaseUrl !== void 0 ? customBaseUrl : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getBaseUrl()));
        const rootUrl = removeUrlParams(this.toPosix(customRootUrl !== null && customRootUrl !== void 0 ? customRootUrl : this.rootname(baseUrl)));
        url = this.toPosix(url);
        if (url.startsWith("/")) {
            return path.join(rootUrl, url.slice(1));
        }
        const absolutePath = this.isAbsolute(url) ? url : this.join(baseUrl, url);
        return absolutePath;
    },
    /**
   * Normalizes the given path, resolving '..' and '.' segments
   * @param path - The path to normalize
   * @example
   * ```ts
   * // Normalize a path with relative segments
   * path.normalize('http://www.example.com/foo/bar/../baz');
   * // -> 'http://www.example.com/foo/baz'
   * // Normalize a file path with relative segments
   * path.normalize('C:\\Users\\User\\Documents\\..\\file.txt');
   * // -> 'C:/Users/User/file.txt'
   * ```
   */ normalize (path2) {
        assertPath(path2);
        if (path2.length === 0) return ".";
        if (this.isDataUrl(path2) || this.isBlobUrl(path2)) return path2;
        path2 = this.toPosix(path2);
        let protocol = "";
        const isAbsolute = path2.startsWith("/");
        if (this.hasProtocol(path2)) {
            protocol = this.rootname(path2);
            path2 = path2.slice(protocol.length);
        }
        const trailingSeparator = path2.endsWith("/");
        path2 = normalizeStringPosix(path2, false);
        if (path2.length > 0 && trailingSeparator) path2 += "/";
        if (isAbsolute) return "/".concat(path2);
        return protocol + path2;
    },
    /**
   * Determines if path is an absolute path.
   * Absolute paths can be urls, data urls, or paths on disk
   * @param path - The path to test
   * @example
   * ```ts
   * // Check if a path is absolute
   * path.isAbsolute('http://www.example.com/foo/bar');
   * // -> true
   * path.isAbsolute('C:/Users/User/Documents/file.txt');
   * // -> true
   * ```
   */ isAbsolute (path2) {
        assertPath(path2);
        path2 = this.toPosix(path2);
        if (this.hasProtocol(path2)) return true;
        return path2.startsWith("/");
    },
    /**
   * Joins all given path segments together using the platform-specific separator as a delimiter,
   * then normalizes the resulting path
   * @param segments - The segments of the path to join
   * @example
   * ```ts
   * // Join multiple path segments
   * path.join('assets', 'images', 'sprite.png');
   * // -> 'assets/images/sprite.png'
   * // Join with relative segments
   * path.join('assets', 'images', '../textures', 'sprite.png');
   * // -> 'assets/textures/sprite.png'
   * ```
   */ join () {
        for(var _len = arguments.length, segments = new Array(_len), _key = 0; _key < _len; _key++){
            segments[_key] = arguments[_key];
        }
        if (segments.length === 0) {
            return ".";
        }
        let joined;
        for(let i = 0; i < segments.length; ++i){
            const arg = segments[i];
            assertPath(arg);
            if (arg.length > 0) {
                if (joined === void 0) joined = arg;
                else {
                    var _segments_;
                    const prevArg = (_segments_ = segments[i - 1]) !== null && _segments_ !== void 0 ? _segments_ : "";
                    if (this.joinExtensions.includes(this.extname(prevArg).toLowerCase())) {
                        joined += "/../".concat(arg);
                    } else {
                        joined += "/".concat(arg);
                    }
                }
            }
        }
        if (joined === void 0) {
            return ".";
        }
        return this.normalize(joined);
    },
    /**
   * Returns the directory name of a path
   * @param path - The path to parse
   * @example
   * ```ts
   * // Get the directory name of a path
   * path.dirname('http://www.example.com/foo/bar/baz.png');
   * // -> 'http://www.example.com/foo/bar'
   * // Get the directory name of a file path
   * path.dirname('C:/Users/User/Documents/file.txt');
   * // -> 'C:/Users/User/Documents'
   * ```
   */ dirname (path2) {
        assertPath(path2);
        if (path2.length === 0) return ".";
        path2 = this.toPosix(path2);
        let code = path2.charCodeAt(0);
        const hasRoot = code === 47;
        let end = -1;
        let matchedSlash = true;
        const proto = this.getProtocol(path2);
        const origpath = path2;
        path2 = path2.slice(proto.length);
        for(let i = path2.length - 1; i >= 1; --i){
            code = path2.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    end = i;
                    break;
                }
            } else {
                matchedSlash = false;
            }
        }
        if (end === -1) return hasRoot ? "/" : this.isUrl(origpath) ? proto + path2 : proto;
        if (hasRoot && end === 1) return "//";
        return proto + path2.slice(0, end);
    },
    /**
   * Returns the root of the path e.g. /, C:/, file:///, http://domain.com/
   * @param path - The path to parse
   * @example
   * ```ts
   * // Get the root of a URL
   * path.rootname('http://www.example.com/foo/bar/baz.png');
   * // -> 'http://www.example.com/'
   * // Get the root of a file path
   * path.rootname('C:/Users/User/Documents/file.txt');
   * // -> 'C:/'
   * ```
   */ rootname (path2) {
        assertPath(path2);
        path2 = this.toPosix(path2);
        let root = "";
        if (path2.startsWith("/")) root = "/";
        else {
            root = this.getProtocol(path2);
        }
        if (this.isUrl(path2)) {
            const index = path2.indexOf("/", root.length);
            if (index !== -1) {
                root = path2.slice(0, index);
            } else root = path2;
            if (!root.endsWith("/")) root += "/";
        }
        return root;
    },
    /**
   * Returns the last portion of a path
   * @param path - The path to test
   * @param ext - Optional extension to remove
   * @example
   * ```ts
   * // Get the basename of a URL
   * path.basename('http://www.example.com/foo/bar/baz.png');
   * // -> 'baz.png'
   * // Get the basename of a file path
   * path.basename('C:/Users/User/Documents/file.txt');
   * // -> 'file.txt'
   * ```
   */ basename (path2, ext) {
        assertPath(path2);
        if (ext) assertPath(ext);
        path2 = removeUrlParams(this.toPosix(path2));
        let start = 0;
        let end = -1;
        let matchedSlash = true;
        let i;
        if (ext !== void 0 && ext.length > 0 && ext.length <= path2.length) {
            if (ext.length === path2.length && ext === path2) return "";
            let extIdx = ext.length - 1;
            let firstNonSlashEnd = -1;
            for(i = path2.length - 1; i >= 0; --i){
                const code = path2.charCodeAt(i);
                if (code === 47) {
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                } else {
                    if (firstNonSlashEnd === -1) {
                        matchedSlash = false;
                        firstNonSlashEnd = i + 1;
                    }
                    if (extIdx >= 0) {
                        if (code === ext.charCodeAt(extIdx)) {
                            if (--extIdx === -1) {
                                end = i;
                            }
                        } else {
                            extIdx = -1;
                            end = firstNonSlashEnd;
                        }
                    }
                }
            }
            if (start === end) end = firstNonSlashEnd;
            else if (end === -1) end = path2.length;
            return path2.slice(start, end);
        }
        for(i = path2.length - 1; i >= 0; --i){
            if (path2.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path2.slice(start, end);
    },
    /**
   * Returns the extension of the path, from the last occurrence of the . (period) character to end of string in the last
   * portion of the path. If there is no . in the last portion of the path, or if there are no . characters other than
   * the first character of the basename of path, an empty string is returned.
   * @param path - The path to parse
   * @example
   * ```ts
   * // Get the extension of a URL
   * path.extname('http://www.example.com/foo/bar/baz.png');
   * // -> '.png'
   * // Get the extension of a file path
   * path.extname('C:/Users/User/Documents/file.txt');
   * // -> '.txt'
   * ```
   */ extname (path2) {
        assertPath(path2);
        path2 = removeUrlParams(this.toPosix(path2));
        let startDot = -1;
        let startPart = 0;
        let end = -1;
        let matchedSlash = true;
        let preDotState = 0;
        for(let i = path2.length - 1; i >= 0; --i){
            const code = path2.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
            if (code === 46) {
                if (startDot === -1) startDot = i;
                else if (preDotState !== 1) preDotState = 1;
            } else if (startDot !== -1) {
                preDotState = -1;
            }
        }
        if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
            return "";
        }
        return path2.slice(startDot, end);
    },
    /**
   * Parses a path into an object containing the 'root', `dir`, `base`, `ext`, and `name` properties.
   * @param path - The path to parse
   * @example
   * ```ts
   * // Parse a URL
   * const parsed = path.parse('http://www.example.com/foo/bar/baz.png');
   * // -> {
   * //   root: 'http://www.example.com/',
   * //   dir: 'http://www.example.com/foo/bar',
   * //   base: 'baz.png',
   * //   ext: '.png',
   * //   name: 'baz'
   * // }
   * // Parse a file path
   * const parsedFile = path.parse('C:/Users/User/Documents/file.txt');
   * // -> {
   * //   root: 'C:/',
   * //   dir: 'C:/Users/User/Documents',
   * //   base: 'file.txt',
   * //   ext: '.txt',
   * //   name: 'file'
   * // }
   * ```
   */ parse (path2) {
        assertPath(path2);
        const ret = {
            root: "",
            dir: "",
            base: "",
            ext: "",
            name: ""
        };
        if (path2.length === 0) return ret;
        path2 = removeUrlParams(this.toPosix(path2));
        let code = path2.charCodeAt(0);
        const isAbsolute = this.isAbsolute(path2);
        let start;
        const protocol = "";
        ret.root = this.rootname(path2);
        if (isAbsolute || this.hasProtocol(path2)) {
            start = 1;
        } else {
            start = 0;
        }
        let startDot = -1;
        let startPart = 0;
        let end = -1;
        let matchedSlash = true;
        let i = path2.length - 1;
        let preDotState = 0;
        for(; i >= start; --i){
            code = path2.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
            if (code === 46) {
                if (startDot === -1) startDot = i;
                else if (preDotState !== 1) preDotState = 1;
            } else if (startDot !== -1) {
                preDotState = -1;
            }
        }
        if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
            if (end !== -1) {
                if (startPart === 0 && isAbsolute) ret.base = ret.name = path2.slice(1, end);
                else ret.base = ret.name = path2.slice(startPart, end);
            }
        } else {
            if (startPart === 0 && isAbsolute) {
                ret.name = path2.slice(1, startDot);
                ret.base = path2.slice(1, end);
            } else {
                ret.name = path2.slice(startPart, startDot);
                ret.base = path2.slice(startPart, end);
            }
            ret.ext = path2.slice(startDot, end);
        }
        ret.dir = this.dirname(path2);
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return ret;
    },
    sep: "/",
    delimiter: ":",
    joinExtensions: [
        ".html"
    ]
};
;
 //# sourceMappingURL=path.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/unsafeEvalSupported.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "unsafeEvalSupported",
    ()=>unsafeEvalSupported
]);
"use strict";
let unsafeEval;
function unsafeEvalSupported() {
    if (typeof unsafeEval === "boolean") {
        return unsafeEval;
    }
    try {
        const func = new Function("param1", "param2", "param3", "return param1[param2] === param3;");
        unsafeEval = func({
            a: "b"
        }, "a", "b") === true;
    } catch (_e) {
        unsafeEval = false;
    }
    return unsafeEval;
}
;
 //# sourceMappingURL=unsafeEvalSupported.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/isWebGLSupported.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isWebGLSupported",
    ()=>isWebGLSupported
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$AbstractRenderer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/AbstractRenderer.mjs [app-client] (ecmascript)");
;
;
"use strict";
let _isWebGLSupported;
function isWebGLSupported(failIfMajorPerformanceCaveat) {
    if (_isWebGLSupported !== void 0) return _isWebGLSupported;
    _isWebGLSupported = (()=>{
        const contextOptions = {
            stencil: true,
            failIfMajorPerformanceCaveat: failIfMajorPerformanceCaveat !== null && failIfMajorPerformanceCaveat !== void 0 ? failIfMajorPerformanceCaveat : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$AbstractRenderer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AbstractRenderer"].defaultOptions.failIfMajorPerformanceCaveat
        };
        try {
            var _gl_getContextAttributes;
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getWebGLRenderingContext()) {
                return false;
            }
            const canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas();
            let gl = canvas.getContext("webgl", contextOptions);
            const success = !!(gl === null || gl === void 0 ? void 0 : (_gl_getContextAttributes = gl.getContextAttributes()) === null || _gl_getContextAttributes === void 0 ? void 0 : _gl_getContextAttributes.stencil);
            if (gl) {
                const loseContext = gl.getExtension("WEBGL_lose_context");
                if (loseContext) {
                    loseContext.loseContext();
                }
            }
            gl = null;
            return success;
        } catch (_e) {
            return false;
        }
    })();
    return _isWebGLSupported;
}
;
 //# sourceMappingURL=isWebGLSupported.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/isWebGPUSupported.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isWebGPUSupported",
    ()=>isWebGPUSupported
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)");
;
"use strict";
let _isWebGPUSupported;
async function isWebGPUSupported() {
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (_isWebGPUSupported !== void 0) return _isWebGPUSupported;
    _isWebGPUSupported = await (async ()=>{
        const gpu = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getNavigator().gpu;
        if (!gpu) {
            return false;
        }
        try {
            const adapter = await gpu.requestAdapter(options);
            await adapter.requestDevice();
            return true;
        } catch (_e) {
            return false;
        }
    })();
    return _isWebGPUSupported;
}
;
 //# sourceMappingURL=isWebGPUSupported.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/const.mjs [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DATA_URI",
    ()=>DATA_URI,
    "VERSION",
    ()=>VERSION
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
;
"use strict";
const DATA_URI = /^\s*data:(?:([\w-]+)\/([\w+.-]+))?(?:;charset=([\w-]+))?(?:;(base64))?,(.*)/i;
const VERSION = "8.13.1";
;
 //# sourceMappingURL=const.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/global/globalHooks.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ApplicationInitHook",
    ()=>ApplicationInitHook,
    "RendererInitHook",
    ()=>RendererInitHook
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/const.mjs [app-client] (ecmascript) <locals>");
;
;
"use strict";
class ApplicationInitHook {
    static init() {
        var _globalThis___PIXI_APP_INIT__, _globalThis;
        (_globalThis___PIXI_APP_INIT__ = (_globalThis = globalThis).__PIXI_APP_INIT__) === null || _globalThis___PIXI_APP_INIT__ === void 0 ? void 0 : _globalThis___PIXI_APP_INIT__.call(_globalThis, this, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["VERSION"]);
    }
    static destroy() {}
}
/** @ignore */ ApplicationInitHook.extension = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].Application;
class RendererInitHook {
    init() {
        var _globalThis___PIXI_RENDERER_INIT__, _globalThis;
        (_globalThis___PIXI_RENDERER_INIT__ = (_globalThis = globalThis).__PIXI_RENDERER_INIT__) === null || _globalThis___PIXI_RENDERER_INIT__ === void 0 ? void 0 : _globalThis___PIXI_RENDERER_INIT__.call(_globalThis, this._renderer, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["VERSION"]);
    }
    destroy() {
        this._renderer = null;
    }
    constructor(renderer){
        this._renderer = renderer;
    }
}
/** @ignore */ RendererInitHook.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "initHook",
    priority: -10
};
;
 //# sourceMappingURL=globalHooks.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/ViewableBuffer.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ViewableBuffer",
    ()=>ViewableBuffer
]);
"use strict";
class ViewableBuffer {
    /** View on the raw binary data as a `Int8Array`. */ get int8View() {
        if (!this._int8View) {
            this._int8View = new Int8Array(this.rawBinaryData);
        }
        return this._int8View;
    }
    /** View on the raw binary data as a `Uint8Array`. */ get uint8View() {
        if (!this._uint8View) {
            this._uint8View = new Uint8Array(this.rawBinaryData);
        }
        return this._uint8View;
    }
    /**  View on the raw binary data as a `Int16Array`. */ get int16View() {
        if (!this._int16View) {
            this._int16View = new Int16Array(this.rawBinaryData);
        }
        return this._int16View;
    }
    /** View on the raw binary data as a `Int32Array`. */ get int32View() {
        if (!this._int32View) {
            this._int32View = new Int32Array(this.rawBinaryData);
        }
        return this._int32View;
    }
    /** View on the raw binary data as a `Float64Array`. */ get float64View() {
        if (!this._float64Array) {
            this._float64Array = new Float64Array(this.rawBinaryData);
        }
        return this._float64Array;
    }
    /** View on the raw binary data as a `BigUint64Array`. */ get bigUint64View() {
        if (!this._bigUint64Array) {
            this._bigUint64Array = new BigUint64Array(this.rawBinaryData);
        }
        return this._bigUint64Array;
    }
    /**
   * Returns the view of the given type.
   * @param type - One of `int8`, `uint8`, `int16`,
   *    `uint16`, `int32`, `uint32`, and `float32`.
   * @returns - typed array of given type
   */ view(type) {
        return this["".concat(type, "View")];
    }
    /** Destroys all buffer references. Do not use after calling this. */ destroy() {
        this.rawBinaryData = null;
        this._int8View = null;
        this._uint8View = null;
        this._int16View = null;
        this.uint16View = null;
        this._int32View = null;
        this.uint32View = null;
        this.float32View = null;
    }
    /**
   * Returns the size of the given type in bytes.
   * @param type - One of `int8`, `uint8`, `int16`,
   *   `uint16`, `int32`, `uint32`, and `float32`.
   * @returns - size of the type in bytes
   */ static sizeOf(type) {
        switch(type){
            case "int8":
            case "uint8":
                return 1;
            case "int16":
            case "uint16":
                return 2;
            case "int32":
            case "uint32":
            case "float32":
                return 4;
            default:
                throw new Error("".concat(type, " isn't a valid view type"));
        }
    }
    constructor(sizeOrBuffer){
        if (typeof sizeOrBuffer === "number") {
            this.rawBinaryData = new ArrayBuffer(sizeOrBuffer);
        } else if (sizeOrBuffer instanceof Uint8Array) {
            this.rawBinaryData = sizeOrBuffer.buffer;
        } else {
            this.rawBinaryData = sizeOrBuffer;
        }
        this.uint32View = new Uint32Array(this.rawBinaryData);
        this.float32View = new Float32Array(this.rawBinaryData);
        this.size = this.rawBinaryData.byteLength;
    }
}
;
 //# sourceMappingURL=ViewableBuffer.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/utils.mjs [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "earcut",
    ()=>earcut
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$earcut$40$3$2e$0$2e$2$2f$node_modules$2f$earcut$2f$src$2f$earcut$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/earcut@3.0.2/node_modules/earcut/src/earcut.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
;
;
"use strict";
const earcut = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$earcut$40$3$2e$0$2e$2$2f$node_modules$2f$earcut$2f$src$2f$earcut$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].default || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$earcut$40$3$2e$0$2e$2$2f$node_modules$2f$earcut$2f$src$2f$earcut$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"];
;
 //# sourceMappingURL=utils.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/network/getResolutionOfUrl.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getResolutionOfUrl",
    ()=>getResolutionOfUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$Resolver$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/resolver/Resolver.mjs [app-client] (ecmascript)");
;
"use strict";
function getResolutionOfUrl(url) {
    let defaultValue = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
    var _Resolver_RETINA_PREFIX;
    const resolution = (_Resolver_RETINA_PREFIX = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$Resolver$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Resolver"].RETINA_PREFIX) === null || _Resolver_RETINA_PREFIX === void 0 ? void 0 : _Resolver_RETINA_PREFIX.exec(url);
    if (resolution) {
        return parseFloat(resolution[1]);
    }
    return defaultValue;
}
;
 //# sourceMappingURL=getResolutionOfUrl.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Color",
    ()=>Color
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$pixi$2b$colord$40$2$2e$9$2e$6$2f$node_modules$2f40$pixi$2f$colord$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@pixi+colord@2.9.6/node_modules/@pixi/colord/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$pixi$2b$colord$40$2$2e$9$2e$6$2f$node_modules$2f40$pixi$2f$colord$2f$plugins$2f$names$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@pixi+colord@2.9.6/node_modules/@pixi/colord/plugins/names.mjs [app-client] (ecmascript)");
;
;
"use strict";
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$pixi$2b$colord$40$2$2e$9$2e$6$2f$node_modules$2f40$pixi$2f$colord$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extend"])([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$pixi$2b$colord$40$2$2e$9$2e$6$2f$node_modules$2f40$pixi$2f$colord$2f$plugins$2f$names$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
const _Color = class _Color {
    /**
   * Get the red component of the color, normalized between 0 and 1.
   * @example
   * ```ts
   * const color = new Color('red');
   * console.log(color.red); // 1
   *
   * const green = new Color('#00ff00');
   * console.log(green.red); // 0
   * ```
   */ get red() {
        return this._components[0];
    }
    /**
   * Get the green component of the color, normalized between 0 and 1.
   * @example
   * ```ts
   * const color = new Color('lime');
   * console.log(color.green); // 1
   *
   * const red = new Color('#ff0000');
   * console.log(red.green); // 0
   * ```
   */ get green() {
        return this._components[1];
    }
    /**
   * Get the blue component of the color, normalized between 0 and 1.
   * @example
   * ```ts
   * const color = new Color('blue');
   * console.log(color.blue); // 1
   *
   * const yellow = new Color('#ffff00');
   * console.log(yellow.blue); // 0
   * ```
   */ get blue() {
        return this._components[2];
    }
    /**
   * Get the alpha component of the color, normalized between 0 and 1.
   * @example
   * ```ts
   * const color = new Color('red');
   * console.log(color.alpha); // 1 (fully opaque)
   *
   * const transparent = new Color('rgba(255, 0, 0, 0.5)');
   * console.log(transparent.alpha); // 0.5 (semi-transparent)
   * ```
   */ get alpha() {
        return this._components[3];
    }
    /**
   * Sets the color value and returns the instance for chaining.
   *
   * This is a chainable version of setting the `value` property.
   * @param value - The color to set. Accepts various formats:
   * - Hex strings/numbers (e.g., '#ff0000', 0xff0000)
   * - RGB/RGBA values (arrays, objects)
   * - CSS color names
   * - HSL/HSLA values
   * - HSV/HSVA values
   * @returns The Color instance for chaining
   * @example
   * ```ts
   * // Basic usage
   * const color = new Color();
   * color.setValue('#ff0000')
   *     .setAlpha(0.5)
   *     .premultiply(0.8);
   *
   * // Different formats
   * color.setValue(0xff0000);          // Hex number
   * color.setValue('#ff0000');         // Hex string
   * color.setValue([1, 0, 0]);         // RGB array
   * color.setValue([1, 0, 0, 0.5]);    // RGBA array
   * color.setValue({ r: 1, g: 0, b: 0 }); // RGB object
   *
   * // Copy from another color
   * const red = new Color('red');
   * color.setValue(red);
   * ```
   * @throws {Error} If the color value is invalid or null
   * @see {@link Color.value} For the underlying value property
   */ setValue(value) {
        this.value = value;
        return this;
    }
    /**
   * The current color source. This property allows getting and setting the color value
   * while preserving the original format where possible.
   * @remarks
   * When setting:
   * - Setting to a `Color` instance copies its source and components
   * - Setting to other valid sources normalizes and stores the value
   * - Setting to `null` throws an Error
   * - The color remains unchanged if normalization fails
   *
   * When getting:
   * - Returns `null` if color was modified by {@link Color.multiply} or {@link Color.premultiply}
   * - Otherwise returns the original color source
   * @example
   * ```ts
   * // Setting different color formats
   * const color = new Color();
   *
   * color.value = 0xff0000;         // Hex number
   * color.value = '#ff0000';        // Hex string
   * color.value = [1, 0, 0];        // RGB array
   * color.value = [1, 0, 0, 0.5];   // RGBA array
   * color.value = { r: 1, g: 0, b: 0 }; // RGB object
   *
   * // Copying from another color
   * const red = new Color('red');
   * color.value = red;  // Copies red's components
   *
   * // Getting the value
   * console.log(color.value);  // Returns original format
   *
   * // After modifications
   * color.multiply([0.5, 0.5, 0.5]);
   * console.log(color.value);  // Returns null
   * ```
   * @throws {Error} When attempting to set `null`
   */ set value(value) {
        if (value instanceof _Color) {
            this._value = this._cloneSource(value._value);
            this._int = value._int;
            this._components.set(value._components);
        } else if (value === null) {
            throw new Error("Cannot set Color#value to null");
        } else if (this._value === null || !this._isSourceEqual(this._value, value)) {
            this._value = this._cloneSource(value);
            this._normalize(this._value);
        }
    }
    get value() {
        return this._value;
    }
    /**
   * Copy a color source internally.
   * @param value - Color source
   */ _cloneSource(value) {
        if (typeof value === "string" || typeof value === "number" || value instanceof Number || value === null) {
            return value;
        } else if (Array.isArray(value) || ArrayBuffer.isView(value)) {
            return value.slice(0);
        } else if (typeof value === "object" && value !== null) {
            return {
                ...value
            };
        }
        return value;
    }
    /**
   * Equality check for color sources.
   * @param value1 - First color source
   * @param value2 - Second color source
   * @returns `true` if the color sources are equal, `false` otherwise.
   */ _isSourceEqual(value1, value2) {
        const type1 = typeof value1;
        const type2 = typeof value2;
        if (type1 !== type2) {
            return false;
        } else if (type1 === "number" || type1 === "string" || value1 instanceof Number) {
            return value1 === value2;
        } else if (Array.isArray(value1) && Array.isArray(value2) || ArrayBuffer.isView(value1) && ArrayBuffer.isView(value2)) {
            if (value1.length !== value2.length) {
                return false;
            }
            return value1.every((v, i)=>v === value2[i]);
        } else if (value1 !== null && value2 !== null) {
            const keys1 = Object.keys(value1);
            const keys2 = Object.keys(value2);
            if (keys1.length !== keys2.length) {
                return false;
            }
            return keys1.every((key)=>value1[key] === value2[key]);
        }
        return value1 === value2;
    }
    /**
   * Convert to a RGBA color object with normalized components (0-1).
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Convert colors to RGBA objects
   * new Color('white').toRgba();     // returns { r: 1, g: 1, b: 1, a: 1 }
   * new Color('#ff0000').toRgba();   // returns { r: 1, g: 0, b: 0, a: 1 }
   *
   * // With transparency
   * new Color('rgba(255,0,0,0.5)').toRgba(); // returns { r: 1, g: 0, b: 0, a: 0.5 }
   * ```
   * @returns An RGBA object with normalized components
   */ toRgba() {
        const [r, g, b, a] = this._components;
        return {
            r,
            g,
            b,
            a
        };
    }
    /**
   * Convert to a RGB color object with normalized components (0-1).
   *
   * Alpha component is omitted in the output.
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Convert colors to RGB objects
   * new Color('white').toRgb();     // returns { r: 1, g: 1, b: 1 }
   * new Color('#ff0000').toRgb();   // returns { r: 1, g: 0, b: 0 }
   *
   * // Alpha is ignored
   * new Color('rgba(255,0,0,0.5)').toRgb(); // returns { r: 1, g: 0, b: 0 }
   * ```
   * @returns An RGB object with normalized components
   */ toRgb() {
        const [r, g, b] = this._components;
        return {
            r,
            g,
            b
        };
    }
    /**
   * Convert to a CSS-style rgba string representation.
   *
   * RGB components are scaled to 0-255 range, alpha remains 0-1.
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Convert colors to RGBA strings
   * new Color('white').toRgbaString();     // returns "rgba(255,255,255,1)"
   * new Color('#ff0000').toRgbaString();   // returns "rgba(255,0,0,1)"
   *
   * // With transparency
   * new Color([1, 0, 0, 0.5]).toRgbaString(); // returns "rgba(255,0,0,0.5)"
   * ```
   * @returns A CSS-compatible rgba string
   */ toRgbaString() {
        const [r, g, b] = this.toUint8RgbArray();
        return "rgba(".concat(r, ",").concat(g, ",").concat(b, ",").concat(this.alpha, ")");
    }
    /**
   * Convert to an [R, G, B] array of clamped uint8 values (0 to 255).
   * @param {number[]|Uint8Array|Uint8ClampedArray} [out] - Optional output array. If not provided,
   * a cached array will be used and returned.
   * @returns Array containing RGB components as integers between 0-255
   * @example
   * ```ts
   * // Basic usage
   * new Color('white').toUint8RgbArray(); // returns [255, 255, 255]
   * new Color('#ff0000').toUint8RgbArray(); // returns [255, 0, 0]
   *
   * // Using custom output array
   * const rgb = new Uint8Array(3);
   * new Color('blue').toUint8RgbArray(rgb); // rgb is now [0, 0, 255]
   *
   * // Using different array types
   * new Color('red').toUint8RgbArray(new Uint8ClampedArray(3)); // [255, 0, 0]
   * new Color('red').toUint8RgbArray([]); // [255, 0, 0]
   * ```
   * @remarks
   * - Output values are always clamped between 0-255
   * - Alpha component is not included in output
   * - Reuses internal cache array if no output array provided
   */ toUint8RgbArray(out) {
        const [r, g, b] = this._components;
        if (!this._arrayRgb) {
            this._arrayRgb = [];
        }
        out || (out = this._arrayRgb);
        out[0] = Math.round(r * 255);
        out[1] = Math.round(g * 255);
        out[2] = Math.round(b * 255);
        return out;
    }
    /**
   * Convert to an [R, G, B, A] array of normalized floats (numbers from 0.0 to 1.0).
   * @param {number[]|Float32Array} [out] - Optional output array. If not provided,
   * a cached array will be used and returned.
   * @returns Array containing RGBA components as floats between 0-1
   * @example
   * ```ts
   * // Basic usage
   * new Color('white').toArray();  // returns [1, 1, 1, 1]
   * new Color('red').toArray();    // returns [1, 0, 0, 1]
   *
   * // With alpha
   * new Color('rgba(255,0,0,0.5)').toArray(); // returns [1, 0, 0, 0.5]
   *
   * // Using custom output array
   * const rgba = new Float32Array(4);
   * new Color('blue').toArray(rgba); // rgba is now [0, 0, 1, 1]
   * ```
   * @remarks
   * - Output values are normalized between 0-1
   * - Includes alpha component as the fourth value
   * - Reuses internal cache array if no output array provided
   */ toArray(out) {
        if (!this._arrayRgba) {
            this._arrayRgba = [];
        }
        out || (out = this._arrayRgba);
        const [r, g, b, a] = this._components;
        out[0] = r;
        out[1] = g;
        out[2] = b;
        out[3] = a;
        return out;
    }
    /**
   * Convert to an [R, G, B] array of normalized floats (numbers from 0.0 to 1.0).
   * @param {number[]|Float32Array} [out] - Optional output array. If not provided,
   * a cached array will be used and returned.
   * @returns Array containing RGB components as floats between 0-1
   * @example
   * ```ts
   * // Basic usage
   * new Color('white').toRgbArray(); // returns [1, 1, 1]
   * new Color('red').toRgbArray();   // returns [1, 0, 0]
   *
   * // Using custom output array
   * const rgb = new Float32Array(3);
   * new Color('blue').toRgbArray(rgb); // rgb is now [0, 0, 1]
   * ```
   * @remarks
   * - Output values are normalized between 0-1
   * - Alpha component is omitted from output
   * - Reuses internal cache array if no output array provided
   */ toRgbArray(out) {
        if (!this._arrayRgb) {
            this._arrayRgb = [];
        }
        out || (out = this._arrayRgb);
        const [r, g, b] = this._components;
        out[0] = r;
        out[1] = g;
        out[2] = b;
        return out;
    }
    /**
   * Convert to a hexadecimal number.
   * @returns The color as a 24-bit RGB integer
   * @example
   * ```ts
   * // Basic usage
   * new Color('white').toNumber(); // returns 0xffffff
   * new Color('red').toNumber();   // returns 0xff0000
   *
   * // Store as hex
   * const color = new Color('blue');
   * const hex = color.toNumber(); // 0x0000ff
   * ```
   */ toNumber() {
        return this._int;
    }
    /**
   * Convert to a BGR number.
   *
   * Useful for platforms that expect colors in BGR format.
   * @returns The color as a 24-bit BGR integer
   * @example
   * ```ts
   * // Convert RGB to BGR
   * new Color(0xffcc99).toBgrNumber(); // returns 0x99ccff
   *
   * // Common use case: platform-specific color format
   * const color = new Color('orange');
   * const bgrColor = color.toBgrNumber(); // Color with swapped R/B channels
   * ```
   * @remarks
   * This swaps the red and blue channels compared to the normal RGB format:
   * - RGB 0xRRGGBB becomes BGR 0xBBGGRR
   */ toBgrNumber() {
        const [r, g, b] = this.toUint8RgbArray();
        return (b << 16) + (g << 8) + r;
    }
    /**
   * Convert to a hexadecimal number in little endian format (e.g., BBGGRR).
   *
   * Useful for platforms that expect colors in little endian byte order.
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Convert RGB color to little endian format
   * new Color(0xffcc99).toLittleEndianNumber(); // returns 0x99ccff
   *
   * // Common use cases:
   * const color = new Color('orange');
   * const leColor = color.toLittleEndianNumber(); // Swaps byte order for LE systems
   *
   * // Multiple conversions
   * const colors = {
   *     normal: 0xffcc99,
   *     littleEndian: new Color(0xffcc99).toLittleEndianNumber(), // 0x99ccff
   *     backToNormal: new Color(0x99ccff).toLittleEndianNumber()  // 0xffcc99
   * };
   * ```
   * @remarks
   * - Swaps R and B channels in the color value
   * - RGB 0xRRGGBB becomes 0xBBGGRR
   * - Useful for systems that use little endian byte order
   * - Can be used to convert back and forth between formats
   * @returns The color as a number in little endian format (BBGGRR)
   * @see {@link Color.toBgrNumber} For BGR format without byte swapping
   */ toLittleEndianNumber() {
        const value = this._int;
        return (value >> 16) + (value & 65280) + ((value & 255) << 16);
    }
    /**
   * Multiply with another color.
   *
   * This action is destructive and modifies the original color.
   * @param {ColorSource} value - The color to multiply by. Accepts any valid color format:
   * - Hex strings/numbers (e.g., '#ff0000', 0xff0000)
   * - RGB/RGBA arrays ([1, 0, 0], [1, 0, 0, 1])
   * - Color objects ({ r: 1, g: 0, b: 0 })
   * - CSS color names ('red', 'blue')
   * @returns this - The Color instance for chaining
   * @example
   * ```ts
   * // Basic multiplication
   * const color = new Color('#ff0000');
   * color.multiply(0x808080); // 50% darker red
   *
   * // With transparency
   * color.multiply([1, 1, 1, 0.5]); // 50% transparent
   *
   * // Chain operations
   * color
   *     .multiply('#808080')
   *     .multiply({ r: 1, g: 1, b: 1, a: 0.5 });
   * ```
   * @remarks
   * - Multiplies each RGB component and alpha separately
   * - Values are clamped between 0-1
   * - Original color format is lost (value becomes null)
   * - Operation cannot be undone
   */ multiply(value) {
        const [r, g, b, a] = _Color._temp.setValue(value)._components;
        this._components[0] *= r;
        this._components[1] *= g;
        this._components[2] *= b;
        this._components[3] *= a;
        this._refreshInt();
        this._value = null;
        return this;
    }
    /**
   * Converts color to a premultiplied alpha format.
   *
   * This action is destructive and modifies the original color.
   * @param alpha - The alpha value to multiply by (0-1)
   * @param {boolean} [applyToRGB=true] - Whether to premultiply RGB channels
   * @returns {Color} The Color instance for chaining
   * @example
   * ```ts
   * // Basic premultiplication
   * const color = new Color('red');
   * color.premultiply(0.5); // 50% transparent red with premultiplied RGB
   *
   * // Alpha only (RGB unchanged)
   * color.premultiply(0.5, false); // 50% transparent, original RGB
   *
   * // Chain with other operations
   * color
   *     .multiply(0x808080)
   *     .premultiply(0.5)
   *     .toNumber();
   * ```
   * @remarks
   * - RGB channels are multiplied by alpha when applyToRGB is true
   * - Alpha is always set to the provided value
   * - Values are clamped between 0-1
   * - Original color format is lost (value becomes null)
   * - Operation cannot be undone
   */ premultiply(alpha) {
        let applyToRGB = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
        if (applyToRGB) {
            this._components[0] *= alpha;
            this._components[1] *= alpha;
            this._components[2] *= alpha;
        }
        this._components[3] = alpha;
        this._refreshInt();
        this._value = null;
        return this;
    }
    /**
   * Returns the color as a 32-bit premultiplied alpha integer.
   *
   * Format: 0xAARRGGBB
   * @param {number} alpha - The alpha value to multiply by (0-1)
   * @param {boolean} [applyToRGB=true] - Whether to premultiply RGB channels
   * @returns {number} The premultiplied color as a 32-bit integer
   * @example
   * ```ts
   * // Convert to premultiplied format
   * const color = new Color('red');
   *
   * // Full opacity (0xFFRRGGBB)
   * color.toPremultiplied(1.0); // 0xFFFF0000
   *
   * // 50% transparency with premultiplied RGB
   * color.toPremultiplied(0.5); // 0x7F7F0000
   *
   * // 50% transparency without RGB premultiplication
   * color.toPremultiplied(0.5, false); // 0x7FFF0000
   * ```
   * @remarks
   * - Returns full opacity (0xFF000000) when alpha is 1.0
   * - Returns 0 when alpha is 0.0 and applyToRGB is true
   * - RGB values are rounded during premultiplication
   */ toPremultiplied(alpha) {
        let applyToRGB = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
        if (alpha === 1) {
            return (255 << 24) + this._int;
        }
        if (alpha === 0) {
            return applyToRGB ? 0 : this._int;
        }
        let r = this._int >> 16 & 255;
        let g = this._int >> 8 & 255;
        let b = this._int & 255;
        if (applyToRGB) {
            r = r * alpha + 0.5 | 0;
            g = g * alpha + 0.5 | 0;
            b = b * alpha + 0.5 | 0;
        }
        return (alpha * 255 << 24) + (r << 16) + (g << 8) + b;
    }
    /**
   * Convert to a hexadecimal string (6 characters).
   * @returns A CSS-compatible hex color string (e.g., "#ff0000")
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Basic colors
   * new Color('red').toHex();    // returns "#ff0000"
   * new Color('white').toHex();  // returns "#ffffff"
   * new Color('black').toHex();  // returns "#000000"
   *
   * // From different formats
   * new Color(0xff0000).toHex(); // returns "#ff0000"
   * new Color([1, 0, 0]).toHex(); // returns "#ff0000"
   * new Color({ r: 1, g: 0, b: 0 }).toHex(); // returns "#ff0000"
   * ```
   * @remarks
   * - Always returns a 6-character hex string
   * - Includes leading "#" character
   * - Alpha channel is ignored
   * - Values are rounded to nearest hex value
   */ toHex() {
        const hexString = this._int.toString(16);
        return "#".concat("000000".substring(0, 6 - hexString.length) + hexString);
    }
    /**
   * Convert to a hexadecimal string with alpha (8 characters).
   * @returns A CSS-compatible hex color string with alpha (e.g., "#ff0000ff")
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // Fully opaque colors
   * new Color('red').toHexa();   // returns "#ff0000ff"
   * new Color('white').toHexa(); // returns "#ffffffff"
   *
   * // With transparency
   * new Color('rgba(255, 0, 0, 0.5)').toHexa(); // returns "#ff00007f"
   * new Color([1, 0, 0, 0]).toHexa(); // returns "#ff000000"
   * ```
   * @remarks
   * - Returns an 8-character hex string
   * - Includes leading "#" character
   * - Alpha is encoded in last two characters
   * - Values are rounded to nearest hex value
   */ toHexa() {
        const alphaValue = Math.round(this._components[3] * 255);
        const alphaString = alphaValue.toString(16);
        return this.toHex() + "00".substring(0, 2 - alphaString.length) + alphaString;
    }
    /**
   * Set alpha (transparency) value while preserving color components.
   *
   * Provides a chainable interface for setting alpha.
   * @param alpha - Alpha value between 0 (fully transparent) and 1 (fully opaque)
   * @returns The Color instance for chaining
   * @example
   * ```ts
   * // Basic alpha setting
   * const color = new Color('red');
   * color.setAlpha(0.5);  // 50% transparent red
   *
   * // Chain with other operations
   * color
   *     .setValue('#ff0000')
   *     .setAlpha(0.8)    // 80% opaque
   *     .premultiply(0.5); // Further modify alpha
   *
   * // Reset to fully opaque
   * color.setAlpha(1);
   * ```
   * @remarks
   * - Alpha value is clamped between 0-1
   * - Can be chained with other color operations
   */ setAlpha(alpha) {
        this._components[3] = this._clamp(alpha);
        return this;
    }
    /**
   * Normalize the input value into rgba
   * @param value - Input value
   */ _normalize(value) {
        let r;
        let g;
        let b;
        let a;
        if ((typeof value === "number" || value instanceof Number) && value >= 0 && value <= 16777215) {
            const int = value;
            r = (int >> 16 & 255) / 255;
            g = (int >> 8 & 255) / 255;
            b = (int & 255) / 255;
            a = 1;
        } else if ((Array.isArray(value) || value instanceof Float32Array) && value.length >= 3 && value.length <= 4) {
            value = this._clamp(value);
            [r, g, b, a = 1] = value;
        } else if ((value instanceof Uint8Array || value instanceof Uint8ClampedArray) && value.length >= 3 && value.length <= 4) {
            value = this._clamp(value, 0, 255);
            [r, g, b, a = 255] = value;
            r /= 255;
            g /= 255;
            b /= 255;
            a /= 255;
        } else if (typeof value === "string" || typeof value === "object") {
            if (typeof value === "string") {
                const match = _Color.HEX_PATTERN.exec(value);
                if (match) {
                    value = "#".concat(match[2]);
                }
            }
            const color = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$pixi$2b$colord$40$2$2e$9$2e$6$2f$node_modules$2f40$pixi$2f$colord$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["colord"])(value);
            if (color.isValid()) {
                ({ r, g, b, a } = color.rgba);
                r /= 255;
                g /= 255;
                b /= 255;
            }
        }
        if (r !== void 0) {
            this._components[0] = r;
            this._components[1] = g;
            this._components[2] = b;
            this._components[3] = a;
            this._refreshInt();
        } else {
            throw new Error("Unable to convert color ".concat(value));
        }
    }
    /** Refresh the internal color rgb number */ _refreshInt() {
        this._clamp(this._components);
        const [r, g, b] = this._components;
        this._int = (r * 255 << 16) + (g * 255 << 8) + (b * 255 | 0);
    }
    /**
   * Clamps values to a range. Will override original values
   * @param value - Value(s) to clamp
   * @param min - Minimum value
   * @param max - Maximum value
   */ _clamp(value) {
        let min = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0, max = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
        if (typeof value === "number") {
            return Math.min(Math.max(value, min), max);
        }
        value.forEach((v, i)=>{
            value[i] = Math.min(Math.max(v, min), max);
        });
        return value;
    }
    /**
   * Check if a value can be interpreted as a valid color format.
   * Supports all color formats that can be used with the Color class.
   * @param value - Value to check
   * @returns True if the value can be used as a color
   * @example
   * ```ts
   * import { Color } from 'pixi.js';
   *
   * // CSS colors and hex values
   * Color.isColorLike('red');          // true
   * Color.isColorLike('#ff0000');      // true
   * Color.isColorLike(0xff0000);       // true
   *
   * // Arrays (RGB/RGBA)
   * Color.isColorLike([1, 0, 0]);      // true
   * Color.isColorLike([1, 0, 0, 0.5]); // true
   *
   * // TypedArrays
   * Color.isColorLike(new Float32Array([1, 0, 0]));          // true
   * Color.isColorLike(new Uint8Array([255, 0, 0]));          // true
   * Color.isColorLike(new Uint8ClampedArray([255, 0, 0]));   // true
   *
   * // Object formats
   * Color.isColorLike({ r: 1, g: 0, b: 0 });            // true (RGB)
   * Color.isColorLike({ r: 1, g: 0, b: 0, a: 0.5 });    // true (RGBA)
   * Color.isColorLike({ h: 0, s: 100, l: 50 });         // true (HSL)
   * Color.isColorLike({ h: 0, s: 100, l: 50, a: 0.5 }); // true (HSLA)
   * Color.isColorLike({ h: 0, s: 100, v: 100 });        // true (HSV)
   * Color.isColorLike({ h: 0, s: 100, v: 100, a: 0.5 });// true (HSVA)
   *
   * // Color instances
   * Color.isColorLike(new Color('red')); // true
   *
   * // Invalid values
   * Color.isColorLike(null);           // false
   * Color.isColorLike(undefined);      // false
   * Color.isColorLike({});             // false
   * Color.isColorLike([]);             // false
   * Color.isColorLike('not-a-color');  // false
   * ```
   * @remarks
   * Checks for the following formats:
   * - Numbers (0x000000 to 0xffffff)
   * - CSS color strings
   * - RGB/RGBA arrays and objects
   * - HSL/HSLA objects
   * - HSV/HSVA objects
   * - TypedArrays (Float32Array, Uint8Array, Uint8ClampedArray)
   * - Color instances
   * @see {@link ColorSource} For supported color format types
   * @see {@link Color.setValue} For setting color values
   * @category utility
   */ static isColorLike(value) {
        return typeof value === "number" || typeof value === "string" || value instanceof Number || value instanceof _Color || Array.isArray(value) || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Float32Array || value.r !== void 0 && value.g !== void 0 && value.b !== void 0 || value.r !== void 0 && value.g !== void 0 && value.b !== void 0 && value.a !== void 0 || value.h !== void 0 && value.s !== void 0 && value.l !== void 0 || value.h !== void 0 && value.s !== void 0 && value.l !== void 0 && value.a !== void 0 || value.h !== void 0 && value.s !== void 0 && value.v !== void 0 || value.h !== void 0 && value.s !== void 0 && value.v !== void 0 && value.a !== void 0;
    }
    /**
   * @param {ColorSource} value - Optional value to use, if not provided, white is used.
   */ constructor(value = 16777215){
        this._value = null;
        this._components = new Float32Array(4);
        this._components.fill(1);
        this._int = 16777215;
        this.value = value;
    }
};
/**
 * Static shared Color instance used for utility operations. This is a singleton color object
 * that can be reused to avoid creating unnecessary Color instances.
 * > [!IMPORTANT] You should be careful when using this shared instance, as it is mutable and can be
 * > changed by any code that uses it.
 * >
 * > It is best used for one-off color operations or temporary transformations.
 * > For persistent colors, create your own Color instance instead.
 * @example
 * ```ts
 * import { Color } from 'pixi.js';
 *
 * // Use shared instance for one-off color operations
 * Color.shared.setValue(0xff0000);
 * const redHex = Color.shared.toHex();     // "#ff0000"
 * const redRgb = Color.shared.toRgbArray(); // [1, 0, 0]
 *
 * // Temporary color transformations
 * const colorNumber = Color.shared
 *     .setValue('#ff0000')     // Set to red
 *     .setAlpha(0.5)          // Make semi-transparent
 *     .premultiply(0.8)       // Apply premultiplication
 *     .toNumber();            // Convert to number
 *
 * // Chain multiple operations
 * const result = Color.shared
 *     .setValue(someColor)
 *     .multiply(tintColor)
 *     .toPremultiplied(alpha);
 * ```
 * @remarks
 * - This is a shared instance - be careful about multiple code paths using it simultaneously
 * - Use for temporary color operations to avoid allocating new Color instances
 * - The value is preserved between operations, so reset if needed
 * - For persistent colors, create your own Color instance instead
 */ _Color.shared = new _Color();
/**
 * Temporary Color object for static uses internally.
 * As to not conflict with Color.shared.
 * @ignore
 */ _Color._temp = new _Color();
/** Pattern for hex strings */ // eslint-disable-next-line @typescript-eslint/naming-convention
_Color.HEX_PATTERN = /^(#|0x)?(([a-f0-9]{3}){1,2}([a-f0-9]{2})?)$/i;
let Color = _Color;
;
 //# sourceMappingURL=Color.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/culling/cullingMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cullingMixin",
    ()=>cullingMixin
]);
"use strict";
const cullingMixin = {
    cullArea: null,
    cullable: false,
    cullableChildren: true
};
;
 //# sourceMappingURL=cullingMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/FilterEffect.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FilterEffect",
    ()=>FilterEffect
]);
"use strict";
class FilterEffect {
    destroy() {
        for(let i = 0; i < this.filters.length; i++){
            this.filters[i].destroy();
        }
        this.filters = null;
        this.filterArea = null;
    }
    constructor(){
        /** the pipe that knows how to handle this effect */ this.pipe = "filter";
        /** the priority of this effect */ this.priority = 1;
    }
}
;
 //# sourceMappingURL=FilterEffect.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DOMAdapter",
    ()=>DOMAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2d$browser$2f$BrowserAdapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment-browser/BrowserAdapter.mjs [app-client] (ecmascript)");
;
"use strict";
let currentAdapter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2d$browser$2f$BrowserAdapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BrowserAdapter"];
const DOMAdapter = {
    /**
   * Returns the current adapter.
   * @returns {environment.Adapter} The current adapter.
   */ get () {
        return currentAdapter;
    },
    /**
   * Sets the current adapter.
   * @param adapter - The new adapter.
   */ set (adapter) {
        currentAdapter = adapter;
    }
};
;
 //# sourceMappingURL=adapter.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/autoDetectEnvironment.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "autoDetectEnvironment",
    ()=>autoDetectEnvironment,
    "loadEnvironmentExtensions",
    ()=>loadEnvironmentExtensions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
;
"use strict";
const environments = [];
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].handleByNamedList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].Environment, environments);
async function loadEnvironmentExtensions(skip) {
    if (skip) return;
    for(let i = 0; i < environments.length; i++){
        const env = environments[i];
        if (env.value.test()) {
            await env.value.load();
            return;
        }
    }
}
async function autoDetectEnvironment(add) {
    return loadEnvironmentExtensions(!add);
}
;
 //# sourceMappingURL=autoDetectEnvironment.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/ticker/const.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UPDATE_PRIORITY",
    ()=>UPDATE_PRIORITY
]);
"use strict";
var UPDATE_PRIORITY = /* @__PURE__ */ ((UPDATE_PRIORITY2)=>{
    UPDATE_PRIORITY2[UPDATE_PRIORITY2["INTERACTION"] = 50] = "INTERACTION";
    UPDATE_PRIORITY2[UPDATE_PRIORITY2["HIGH"] = 25] = "HIGH";
    UPDATE_PRIORITY2[UPDATE_PRIORITY2["NORMAL"] = 0] = "NORMAL";
    UPDATE_PRIORITY2[UPDATE_PRIORITY2["LOW"] = -25] = "LOW";
    UPDATE_PRIORITY2[UPDATE_PRIORITY2["UTILITY"] = -50] = "UTILITY";
    return UPDATE_PRIORITY2;
})(UPDATE_PRIORITY || {});
;
 //# sourceMappingURL=const.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/ticker/TickerListener.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TickerListener",
    ()=>TickerListener
]);
"use strict";
class TickerListener {
    /**
   * Simple compare function to figure out if a function and context match.
   * @param fn - The listener function to be added for one update
   * @param context - The listener context
   * @returns `true` if the listener match the arguments
   */ match(fn) {
        let context = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
        return this._fn === fn && this._context === context;
    }
    /**
   * Emit by calling the current function.
   * @param ticker - The ticker emitting.
   * @returns Next ticker
   */ emit(ticker) {
        if (this._fn) {
            if (this._context) {
                this._fn.call(this._context, ticker);
            } else {
                this._fn(ticker);
            }
        }
        const redirect = this.next;
        if (this._once) {
            this.destroy(true);
        }
        if (this._destroyed) {
            this.next = null;
        }
        return redirect;
    }
    /**
   * Connect to the list.
   * @param previous - Input node, previous listener
   */ connect(previous) {
        this.previous = previous;
        if (previous.next) {
            previous.next.previous = this;
        }
        this.next = previous.next;
        previous.next = this;
    }
    /**
   * Destroy and don't use after this.
   * @param hard - `true` to remove the `next` reference, this
   *        is considered a hard destroy. Soft destroy maintains the next reference.
   * @returns The listener to redirect while emitting or removing.
   */ destroy() {
        let hard = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        this._destroyed = true;
        this._fn = null;
        this._context = null;
        if (this.previous) {
            this.previous.next = this.next;
        }
        if (this.next) {
            this.next.previous = this.previous;
        }
        const redirect = this.next;
        this.next = hard ? null : redirect;
        this.previous = null;
        return redirect;
    }
    /**
   * Constructor
   * @private
   * @param fn - The listener function to be added for one update
   * @param context - The listener context
   * @param priority - The priority for emitting
   * @param once - If the handler should fire once
   */ constructor(fn, context = null, priority = 0, once = false){
        /** The next item in chain. */ this.next = null;
        /** The previous item in chain. */ this.previous = null;
        /** `true` if this listener has been destroyed already. */ this._destroyed = false;
        this._fn = fn;
        this._context = context;
        this.priority = priority;
        this._once = once;
    }
}
;
 //# sourceMappingURL=TickerListener.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/ticker/Ticker.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Ticker",
    ()=>Ticker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/ticker/const.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$TickerListener$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/ticker/TickerListener.mjs [app-client] (ecmascript)");
;
;
"use strict";
const _Ticker = class _Ticker {
    /**
   * Conditionally requests a new animation frame.
   * If a frame has not already been requested, and if the internal
   * emitter has listeners, a new frame is requested.
   */ _requestIfNeeded() {
        if (this._requestId === null && this._head.next) {
            this.lastTime = performance.now();
            this._lastFrame = this.lastTime;
            this._requestId = requestAnimationFrame(this._tick);
        }
    }
    /** Conditionally cancels a pending animation frame. */ _cancelIfNeeded() {
        if (this._requestId !== null) {
            cancelAnimationFrame(this._requestId);
            this._requestId = null;
        }
    }
    /**
   * Conditionally requests a new animation frame.
   * If the ticker has been started it checks if a frame has not already
   * been requested, and if the internal emitter has listeners. If these
   * conditions are met, a new frame is requested. If the ticker has not
   * been started, but autoStart is `true`, then the ticker starts now,
   * and continues with the previous conditions to request a new frame.
   */ _startIfPossible() {
        if (this.started) {
            this._requestIfNeeded();
        } else if (this.autoStart) {
            this.start();
        }
    }
    /**
   * Register a handler for tick events.
   * @param fn - The listener function to add. Receives the Ticker instance as parameter
   * @param context - The context for the listener
   * @param priority - The priority of the listener
   * @example
   * ```ts
   * // Access time properties through the ticker parameter
   * ticker.add((ticker) => {
   *     // Use deltaTime (dimensionless scalar) for frame-independent animations
   *     sprite.rotation += 0.1 * ticker.deltaTime;
   *
   *     // Use deltaMS (milliseconds) for time-based calculations
   *     const progress = ticker.deltaMS / animationDuration;
   *
   *     // Use elapsedMS for raw timing measurements
   *     console.log(`Raw frame time: ${ticker.elapsedMS}ms`);
   * });
   * ```
   */ add(fn, context) {
        let priority = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UPDATE_PRIORITY"].NORMAL;
        return this._addListener(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$TickerListener$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TickerListener"](fn, context, priority));
    }
    /**
   * Add a handler for the tick event which is only executed once on the next frame.
   * @example
   * ```ts
   * // Basic one-time update
   * ticker.addOnce(() => {
   *     console.log('Runs next frame only');
   * });
   *
   * // With specific context
   * const game = {
   *     init(ticker) {
   *         this.loadResources();
   *         console.log('Game initialized');
   *     }
   * };
   * ticker.addOnce(game.init, game);
   *
   * // With priority
   * ticker.addOnce(
   *     () => {
   *         // High priority one-time setup
   *         physics.init();
   *     },
   *     undefined,
   *     UPDATE_PRIORITY.HIGH
   * );
   * ```
   * @param fn - The listener function to be added for one update
   * @param context - The listener context
   * @param priority - The priority for emitting (default: UPDATE_PRIORITY.NORMAL)
   * @returns This instance of a ticker
   * @see {@link Ticker#add} For continuous updates
   * @see {@link Ticker#remove} For removing handlers
   */ addOnce(fn, context) {
        let priority = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UPDATE_PRIORITY"].NORMAL;
        return this._addListener(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$TickerListener$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TickerListener"](fn, context, priority, true));
    }
    /**
   * Internally adds the event handler so that it can be sorted by priority.
   * Priority allows certain handler (user, AnimatedSprite, Interaction) to be run
   * before the rendering.
   * @private
   * @param listener - Current listener being added.
   * @returns This instance of a ticker
   */ _addListener(listener) {
        let current = this._head.next;
        let previous = this._head;
        if (!current) {
            listener.connect(previous);
        } else {
            while(current){
                if (listener.priority > current.priority) {
                    listener.connect(previous);
                    break;
                }
                previous = current;
                current = current.next;
            }
            if (!listener.previous) {
                listener.connect(previous);
            }
        }
        this._startIfPossible();
        return this;
    }
    /**
   * Removes any handlers matching the function and context parameters.
   * If no handlers are left after removing, then it cancels the animation frame.
   * @example
   * ```ts
   * // Basic removal
   * const onTick = () => {
   *     sprite.rotation += 0.1;
   * };
   * ticker.add(onTick);
   * ticker.remove(onTick);
   *
   * // Remove with context
   * const game = {
   *     update(ticker) {
   *         this.physics.update(ticker.deltaTime);
   *     }
   * };
   * ticker.add(game.update, game);
   * ticker.remove(game.update, game);
   *
   * // Remove all matching handlers
   * // (if same function was added multiple times)
   * ticker.add(onTick);
   * ticker.add(onTick);
   * ticker.remove(onTick); // Removes all instances
   * ```
   * @param fn - The listener function to be removed
   * @param context - The listener context to be removed
   * @returns This instance of a ticker
   * @see {@link Ticker#add} For adding handlers
   * @see {@link Ticker#addOnce} For one-time handlers
   */ remove(fn, context) {
        let listener = this._head.next;
        while(listener){
            if (listener.match(fn, context)) {
                listener = listener.destroy();
            } else {
                listener = listener.next;
            }
        }
        if (!this._head.next) {
            this._cancelIfNeeded();
        }
        return this;
    }
    /**
   * The number of listeners on this ticker, calculated by walking through linked list.
   * @example
   * ```ts
   * // Check number of active listeners
   * const ticker = new Ticker();
   * console.log(ticker.count); // 0
   *
   * // Add some listeners
   * ticker.add(() => {});
   * ticker.add(() => {});
   * console.log(ticker.count); // 2
   *
   * // Check after cleanup
   * ticker.destroy();
   * console.log(ticker.count); // 0
   * ```
   * @readonly
   * @see {@link Ticker#add} For adding listeners
   * @see {@link Ticker#remove} For removing listeners
   */ get count() {
        if (!this._head) {
            return 0;
        }
        let count = 0;
        let current = this._head;
        while(current = current.next){
            count++;
        }
        return count;
    }
    /**
   * Starts the ticker. If the ticker has listeners a new animation frame is requested at this point.
   * @example
   * ```ts
   * // Basic manual start
   * const ticker = new Ticker();
   * ticker.add(() => {
   *     // Animation code here
   * });
   * ticker.start();
   * ```
   * @see {@link Ticker#stop} For stopping the ticker
   * @see {@link Ticker#autoStart} For automatic starting
   * @see {@link Ticker#started} For checking ticker state
   */ start() {
        if (!this.started) {
            this.started = true;
            this._requestIfNeeded();
        }
    }
    /**
   * Stops the ticker. If the ticker has requested an animation frame it is canceled at this point.
   * @example
   * ```ts
   * // Basic stop
   * const ticker = new Ticker();
   * ticker.stop();
   * ```
   * @see {@link Ticker#start} For starting the ticker
   * @see {@link Ticker#started} For checking ticker state
   * @see {@link Ticker#destroy} For cleaning up the ticker
   */ stop() {
        if (this.started) {
            this.started = false;
            this._cancelIfNeeded();
        }
    }
    /**
   * Destroy the ticker and don't use after this. Calling this method removes all references to internal events.
   * @example
   * ```ts
   * // Clean up with active listeners
   * const ticker = new Ticker();
   * ticker.add(() => {});
   * ticker.destroy(); // Removes all listeners
   * ```
   * @see {@link Ticker#stop} For stopping without destroying
   * @see {@link Ticker#remove} For removing specific listeners
   */ destroy() {
        if (!this._protected) {
            this.stop();
            let listener = this._head.next;
            while(listener){
                listener = listener.destroy(true);
            }
            this._head.destroy();
            this._head = null;
        }
    }
    /**
   * Triggers an update.
   *
   * An update entails setting the
   * current {@link Ticker#elapsedMS|elapsedMS},
   * the current {@link Ticker#deltaTime|deltaTime},
   * invoking all listeners with current deltaTime,
   * and then finally setting {@link Ticker#lastTime|lastTime}
   * with the value of currentTime that was provided.
   *
   * This method will be called automatically by animation
   * frame callbacks if the ticker instance has been started
   * and listeners are added.
   * @example
   * ```ts
   * // Basic manual update
   * const ticker = new Ticker();
   * ticker.update(performance.now());
   * ```
   * @param currentTime - The current time of execution (defaults to performance.now())
   * @see {@link Ticker#deltaTime} For frame delta value
   * @see {@link Ticker#elapsedMS} For raw elapsed time
   */ update() {
        let currentTime = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : performance.now();
        let elapsedMS;
        if (currentTime > this.lastTime) {
            elapsedMS = this.elapsedMS = currentTime - this.lastTime;
            if (elapsedMS > this._maxElapsedMS) {
                elapsedMS = this._maxElapsedMS;
            }
            elapsedMS *= this.speed;
            if (this._minElapsedMS) {
                const delta = currentTime - this._lastFrame | 0;
                if (delta < this._minElapsedMS) {
                    return;
                }
                this._lastFrame = currentTime - delta % this._minElapsedMS;
            }
            this.deltaMS = elapsedMS;
            this.deltaTime = this.deltaMS * _Ticker.targetFPMS;
            const head = this._head;
            let listener = head.next;
            while(listener){
                listener = listener.emit(this);
            }
            if (!head.next) {
                this._cancelIfNeeded();
            }
        } else {
            this.deltaTime = this.deltaMS = this.elapsedMS = 0;
        }
        this.lastTime = currentTime;
    }
    /**
   * The frames per second at which this ticker is running.
   * The default is approximately 60 in most modern browsers.
   * > [!NOTE] This does not factor in the value of
   * > {@link Ticker#speed|speed}, which is specific
   * > to scaling {@link Ticker#deltaTime|deltaTime}.
   * @example
   * ```ts
   * // Basic FPS monitoring
   * ticker.add(() => {
   *     console.log(`Current FPS: ${Math.round(ticker.FPS)}`);
   * });
   * ```
   * @readonly
   */ get FPS() {
        return 1e3 / this.elapsedMS;
    }
    /**
   * Manages the maximum amount of milliseconds allowed to
   * elapse between invoking {@link Ticker#update|update}.
   *
   * This value is used to cap {@link Ticker#deltaTime|deltaTime},
   * but does not effect the measured value of {@link Ticker#FPS|FPS}.
   *
   * When setting this property it is clamped to a value between
   * `0` and `Ticker.targetFPMS * 1000`.
   * @example
   * ```ts
   * // Set minimum acceptable frame rate
   * const ticker = new Ticker();
   * ticker.minFPS = 30; // Never go below 30 FPS
   *
   * // Use with maxFPS for frame rate clamping
   * ticker.minFPS = 30;
   * ticker.maxFPS = 60;
   *
   * // Monitor delta capping
   * ticker.add(() => {
   *     // Delta time will be capped based on minFPS
   *     console.log(`Delta time: ${ticker.deltaTime}`);
   * });
   * ```
   * @default 10
   */ get minFPS() {
        return 1e3 / this._maxElapsedMS;
    }
    set minFPS(fps) {
        const minFPS = Math.min(this.maxFPS, fps);
        const minFPMS = Math.min(Math.max(0, minFPS) / 1e3, _Ticker.targetFPMS);
        this._maxElapsedMS = 1 / minFPMS;
    }
    /**
   * Manages the minimum amount of milliseconds required to
   * elapse between invoking {@link Ticker#update|update}.
   *
   * This will effect the measured value of {@link Ticker#FPS|FPS}.
   *
   * If it is set to `0`, then there is no limit; PixiJS will render as many frames as it can.
   * Otherwise it will be at least `minFPS`
   * @example
   * ```ts
   * // Set minimum acceptable frame rate
   * const ticker = new Ticker();
   * ticker.maxFPS = 60; // Never go above 60 FPS
   *
   * // Use with maxFPS for frame rate clamping
   * ticker.minFPS = 30;
   * ticker.maxFPS = 60;
   *
   * // Monitor delta capping
   * ticker.add(() => {
   *     // Delta time will be capped based on maxFPS
   *     console.log(`Delta time: ${ticker.deltaTime}`);
   * });
   * ```
   * @default 0
   */ get maxFPS() {
        if (this._minElapsedMS) {
            return Math.round(1e3 / this._minElapsedMS);
        }
        return 0;
    }
    set maxFPS(fps) {
        if (fps === 0) {
            this._minElapsedMS = 0;
        } else {
            const maxFPS = Math.max(this.minFPS, fps);
            this._minElapsedMS = 1 / (maxFPS / 1e3);
        }
    }
    /**
   * The shared ticker instance used by {@link AnimatedSprite} and by
   * {@link VideoSource} to update animation frames / video textures.
   *
   * It may also be used by {@link Application} if created with the `sharedTicker` option property set to true.
   *
   * The property {@link Ticker#autoStart|autoStart} is set to `true` for this instance.
   * Please follow the examples for usage, including how to opt-out of auto-starting the shared ticker.
   * @example
   * import { Ticker } from 'pixi.js';
   *
   * const ticker = Ticker.shared;
   * // Set this to prevent starting this ticker when listeners are added.
   * // By default this is true only for the Ticker.shared instance.
   * ticker.autoStart = false;
   *
   * // FYI, call this to ensure the ticker is stopped. It should be stopped
   * // if you have not attempted to render anything yet.
   * ticker.stop();
   *
   * // Call this when you are ready for a running shared ticker.
   * ticker.start();
   * @example
   * import { autoDetectRenderer, Container } from 'pixi.js';
   *
   * // You may use the shared ticker to render...
   * const renderer = autoDetectRenderer();
   * const stage = new Container();
   * document.body.appendChild(renderer.view);
   * ticker.add((time) => renderer.render(stage));
   *
   * // Or you can just update it manually.
   * ticker.autoStart = false;
   * ticker.stop();
   * const animate = (time) => {
   *     ticker.update(time);
   *     renderer.render(stage);
   *     requestAnimationFrame(animate);
   * };
   * animate(performance.now());
   * @type {Ticker}
   * @readonly
   */ static get shared() {
        if (!_Ticker._shared) {
            const shared = _Ticker._shared = new _Ticker();
            shared.autoStart = true;
            shared._protected = true;
        }
        return _Ticker._shared;
    }
    /**
   * The system ticker instance used by {@link PrepareBase} for core timing
   * functionality that shouldn't usually need to be paused, unlike the `shared`
   * ticker which drives visual animations and rendering which may want to be paused.
   *
   * The property {@link Ticker#autoStart|autoStart} is set to `true` for this instance.
   * @type {Ticker}
   * @readonly
   * @advanced
   */ static get system() {
        if (!_Ticker._system) {
            const system = _Ticker._system = new _Ticker();
            system.autoStart = true;
            system._protected = true;
        }
        return _Ticker._system;
    }
    constructor(){
        /**
     * Whether or not this ticker should invoke the method {@link Ticker#start|start}
     * automatically when a listener is added.
     * @example
     * ```ts
     * // Default behavior (manual start)
     * const ticker = new Ticker();
     * ticker.autoStart = false;
     * ticker.add(() => {
     *     // Won't run until ticker.start() is called
     * });
     *
     * // Auto-start behavior
     * const autoTicker = new Ticker();
     * autoTicker.autoStart = true;
     * autoTicker.add(() => {
     *     // Runs immediately when added
     * });
     * ```
     * @default false
     * @see {@link Ticker#start} For manually starting the ticker
     * @see {@link Ticker#stop} For manually stopping the ticker
     */ this.autoStart = false;
        /**
     * Scalar representing the delta time factor.
     * This is a dimensionless value representing the fraction of a frame at the target framerate.
     * At 60 FPS, this value is typically around 1.0.
     *
     * This is NOT in milliseconds - it's a scalar multiplier for frame-independent animations.
     * For actual milliseconds, use {@link Ticker#deltaMS}.
     * @member {number}
     * @example
     * ```ts
     * // Frame-independent animation using deltaTime scalar
     * ticker.add((ticker) => {
     *     // Rotate sprite by 0.1 radians per frame, scaled by deltaTime
     *     sprite.rotation += 0.1 * ticker.deltaTime;
     * });
     * ```
     */ this.deltaTime = 1;
        /**
     * The last time update was invoked, in milliseconds since epoch.
     * Similar to performance.now() timestamp format.
     *
     * Used internally for calculating time deltas between frames.
     * @member {number}
     * @example
     * ```ts
     * ticker.add((ticker) => {
     *     const currentTime = performance.now();
     *     const timeSinceLastFrame = currentTime - ticker.lastTime;
     *     console.log(`Time since last frame: ${timeSinceLastFrame}ms`);
     * });
     * ```
     */ this.lastTime = -1;
        /**
     * Factor of current {@link Ticker#deltaTime|deltaTime}.
     * Used to scale time for slow motion or fast-forward effects.
     * @example
     * ```ts
     * // Basic speed adjustment
     * ticker.speed = 0.5; // Half speed (slow motion)
     * ticker.speed = 2.0; // Double speed (fast forward)
     *
     * // Temporary speed changes
     * function slowMotion() {
     *     const normalSpeed = ticker.speed;
     *     ticker.speed = 0.2;
     *     setTimeout(() => {
     *         ticker.speed = normalSpeed;
     *     }, 1000);
     * }
     * ```
     */ this.speed = 1;
        /**
     * Whether or not this ticker has been started.
     *
     * `true` if {@link Ticker#start|start} has been called.
     * `false` if {@link Ticker#stop|Stop} has been called.
     *
     * While `false`, this value may change to `true` in the
     * event of {@link Ticker#autoStart|autoStart} being `true`
     * and a listener is added.
     * @example
     * ```ts
     * // Check ticker state
     * const ticker = new Ticker();
     * console.log(ticker.started); // false
     *
     * // Start and verify
     * ticker.start();
     * console.log(ticker.started); // true
     * ```
     */ this.started = false;
        /** Internal current frame request ID */ this._requestId = null;
        /**
     * Internal value managed by minFPS property setter and getter.
     * This is the maximum allowed milliseconds between updates.
     */ this._maxElapsedMS = 100;
        /**
     * Internal value managed by minFPS property setter and getter.
     * This is the minimum allowed milliseconds between updates.
     */ this._minElapsedMS = 0;
        /** If enabled, deleting is disabled.*/ this._protected = false;
        /** The last time keyframe was executed. Maintains a relatively fixed interval with the previous value. */ this._lastFrame = -1;
        this._head = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$TickerListener$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TickerListener"](null, null, Infinity);
        this.deltaMS = 1 / _Ticker.targetFPMS;
        this.elapsedMS = 1 / _Ticker.targetFPMS;
        this._tick = (time)=>{
            this._requestId = null;
            if (this.started) {
                this.update(time);
                if (this.started && this._requestId === null && this._head.next) {
                    this._requestId = requestAnimationFrame(this._tick);
                }
            }
        };
    }
};
/**
 * Target frame rate in frames per millisecond.
 * Used for converting deltaTime to a scalar time delta.
 * @example
 * ```ts
 * // Default is 0.06 (60 FPS)
 * console.log(Ticker.targetFPMS); // 0.06
 *
 * // Calculate target frame duration
 * const frameDuration = 1 / Ticker.targetFPMS; // ≈ 16.67ms
 *
 * // Use in custom timing calculations
 * const deltaTime = elapsedMS * Ticker.targetFPMS;
 * ```
 * @remarks
 * - Default is 0.06 (equivalent to 60 FPS)
 * - Used in deltaTime calculations
 * - Affects all ticker instances
 * @default 0.06
 * @see {@link Ticker#deltaTime} For time scaling
 * @see {@link Ticker#FPS} For actual frame rate
 */ _Ticker.targetFPMS = 0.06;
let Ticker = _Ticker;
;
 //# sourceMappingURL=Ticker.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/spritesheet/Spritesheet.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Spritesheet",
    ()=>Spritesheet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
const _Spritesheet = class _Spritesheet {
    /**
   * Parser spritesheet from loaded data. This is done asynchronously
   * to prevent creating too many Texture within a single process.
   */ parse() {
        return new Promise((resolve)=>{
            this._callback = resolve;
            this._batchIndex = 0;
            if (this._frameKeys.length <= _Spritesheet.BATCH_SIZE) {
                this._processFrames(0);
                this._processAnimations();
                this._parseComplete();
            } else {
                this._nextBatch();
            }
        });
    }
    /**
   * Process a batch of frames
   * @param initialFrameIndex - The index of frame to start.
   */ _processFrames(initialFrameIndex) {
        let frameIndex = initialFrameIndex;
        const maxFrames = _Spritesheet.BATCH_SIZE;
        while(frameIndex - initialFrameIndex < maxFrames && frameIndex < this._frameKeys.length){
            const i = this._frameKeys[frameIndex];
            const data = this._frames[i];
            const rect = data.frame;
            if (rect) {
                let frame = null;
                let trim = null;
                const sourceSize = data.trimmed !== false && data.sourceSize ? data.sourceSize : data.frame;
                const orig = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"](0, 0, Math.floor(sourceSize.w) / this.resolution, Math.floor(sourceSize.h) / this.resolution);
                if (data.rotated) {
                    frame = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"](Math.floor(rect.x) / this.resolution, Math.floor(rect.y) / this.resolution, Math.floor(rect.h) / this.resolution, Math.floor(rect.w) / this.resolution);
                } else {
                    frame = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"](Math.floor(rect.x) / this.resolution, Math.floor(rect.y) / this.resolution, Math.floor(rect.w) / this.resolution, Math.floor(rect.h) / this.resolution);
                }
                if (data.trimmed !== false && data.spriteSourceSize) {
                    trim = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"](Math.floor(data.spriteSourceSize.x) / this.resolution, Math.floor(data.spriteSourceSize.y) / this.resolution, Math.floor(rect.w) / this.resolution, Math.floor(rect.h) / this.resolution);
                }
                this.textures[i] = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]({
                    source: this.textureSource,
                    frame,
                    orig,
                    trim,
                    rotate: data.rotated ? 2 : 0,
                    defaultAnchor: data.anchor,
                    defaultBorders: data.borders,
                    label: i.toString()
                });
            }
            frameIndex++;
        }
    }
    /** Parse animations config. */ _processAnimations() {
        const animations = this.data.animations || {};
        for(const animName in animations){
            this.animations[animName] = [];
            for(let i = 0; i < animations[animName].length; i++){
                const frameName = animations[animName][i];
                this.animations[animName].push(this.textures[frameName]);
            }
        }
    }
    /** The parse has completed. */ _parseComplete() {
        const callback = this._callback;
        this._callback = null;
        this._batchIndex = 0;
        callback.call(this, this.textures);
    }
    /** Begin the next batch of textures. */ _nextBatch() {
        this._processFrames(this._batchIndex * _Spritesheet.BATCH_SIZE);
        this._batchIndex++;
        setTimeout(()=>{
            if (this._batchIndex * _Spritesheet.BATCH_SIZE < this._frameKeys.length) {
                this._nextBatch();
            } else {
                this._processAnimations();
                this._parseComplete();
            }
        }, 0);
    }
    /**
   * Destroy Spritesheet and don't use after this.
   * @param {boolean} [destroyBase=false] - Whether to destroy the base texture as well
   */ destroy() {
        let destroyBase = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        for(const i in this.textures){
            this.textures[i].destroy();
        }
        this._frames = null;
        this._frameKeys = null;
        this.data = null;
        this.textures = null;
        if (destroyBase) {
            var _this__texture;
            (_this__texture = this._texture) === null || _this__texture === void 0 ? void 0 : _this__texture.destroy();
            this.textureSource.destroy();
        }
        this._texture = null;
        this.textureSource = null;
        this.linkedSheets = [];
    }
    constructor(optionsOrTexture, arg1){
        /** For multi-packed spritesheets, this contains a reference to all the other spritesheets it depends on. */ this.linkedSheets = [];
        let options = optionsOrTexture;
        if ((optionsOrTexture === null || optionsOrTexture === void 0 ? void 0 : optionsOrTexture.source) instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureSource"]) {
            options = {
                texture: optionsOrTexture,
                data: arg1
            };
        }
        const { texture, data, cachePrefix = "" } = options;
        this.cachePrefix = cachePrefix;
        this._texture = texture instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"] ? texture : null;
        this.textureSource = texture.source;
        this.textures = {};
        this.animations = {};
        this.data = data;
        const metaResolution = parseFloat(data.meta.scale);
        if (metaResolution) {
            this.resolution = metaResolution;
            texture.source.resolution = this.resolution;
        } else {
            this.resolution = texture.source._resolution;
        }
        this._frames = this.data.frames;
        this._frameKeys = Object.keys(this._frames);
        this._batchIndex = 0;
        this._callback = null;
    }
};
/**
 * The maximum number of Textures to build per process.
 * @advanced
 */ _Spritesheet.BATCH_SIZE = 1e3;
let Spritesheet = _Spritesheet;
;
 //# sourceMappingURL=Spritesheet.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/spritesheet/spritesheetAsset.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "spritesheetAsset",
    ()=>spritesheetAsset
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/LoaderParser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$Resolver$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/resolver/Resolver.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$copySearchParams$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/copySearchParams.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/path.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$spritesheet$2f$Spritesheet$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/spritesheet/Spritesheet.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
const validImages = [
    "jpg",
    "png",
    "jpeg",
    "avif",
    "webp",
    "basis",
    "etc2",
    "bc7",
    "bc6h",
    "bc5",
    "bc4",
    "bc3",
    "bc2",
    "bc1",
    "eac",
    "astc"
];
function getCacheableAssets(keys, asset, ignoreMultiPack) {
    const out = {};
    keys.forEach((key)=>{
        out[key] = asset;
    });
    Object.keys(asset.textures).forEach((key)=>{
        out["".concat(asset.cachePrefix).concat(key)] = asset.textures[key];
    });
    if (!ignoreMultiPack) {
        const basePath = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["path"].dirname(keys[0]);
        asset.linkedSheets.forEach((item, i)=>{
            const out2 = getCacheableAssets([
                "".concat(basePath, "/").concat(asset.data.meta.related_multi_packs[i])
            ], item, true);
            Object.assign(out, out2);
        });
    }
    return out;
}
const spritesheetAsset = {
    extension: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].Asset,
    /** Handle the caching of the related Spritesheet Textures */ cache: {
        test: (asset)=>asset instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$spritesheet$2f$Spritesheet$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Spritesheet"],
        getCacheableAssets: (keys, asset)=>getCacheableAssets(keys, asset, false)
    },
    /** Resolve the resolution of the asset. */ resolver: {
        extension: {
            type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].ResolveParser,
            name: "resolveSpritesheet"
        },
        test: (value)=>{
            const tempURL = value.split("?")[0];
            const split = tempURL.split(".");
            const extension = split.pop();
            const format = split.pop();
            return extension === "json" && validImages.includes(format);
        },
        parse: (value)=>{
            var _Resolver_RETINA_PREFIX_exec;
            const split = value.split(".");
            var _Resolver_RETINA_PREFIX_exec_;
            return {
                resolution: parseFloat((_Resolver_RETINA_PREFIX_exec_ = (_Resolver_RETINA_PREFIX_exec = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$resolver$2f$Resolver$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Resolver"].RETINA_PREFIX.exec(value)) === null || _Resolver_RETINA_PREFIX_exec === void 0 ? void 0 : _Resolver_RETINA_PREFIX_exec[1]) !== null && _Resolver_RETINA_PREFIX_exec_ !== void 0 ? _Resolver_RETINA_PREFIX_exec_ : "1"),
                format: split[split.length - 2],
                src: value
            };
        }
    },
    /**
   * Loader plugin that parses sprite sheets!
   * once the JSON has been loaded this checks to see if the JSON is spritesheet data.
   * If it is, we load the spritesheets image and parse the data into Spritesheet
   * All textures in the sprite sheet are then added to the cache
   */ loader: {
        /** used for deprecation purposes */ name: "spritesheetLoader",
        id: "spritesheet",
        extension: {
            type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].LoadParser,
            priority: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LoaderParserPriority"].Normal,
            name: "spritesheetLoader"
        },
        async testParse (asset, options) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["path"].extname(options.src).toLowerCase() === ".json" && !!asset.frames;
        },
        async parse (asset, options, loader) {
            var _asset_meta;
            var _options_data;
            const { texture: imageTexture, // if user need to use preloaded texture
            imageFilename, // if user need to use custom filename (not from jsonFile.meta.image)
            textureOptions, // if user need to set texture options on texture
            cachePrefix } = (_options_data = options === null || options === void 0 ? void 0 : options.data) !== null && _options_data !== void 0 ? _options_data : {};
            let basePath = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["path"].dirname(options.src);
            if (basePath && basePath.lastIndexOf("/") !== basePath.length - 1) {
                basePath += "/";
            }
            let texture;
            if (imageTexture instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]) {
                texture = imageTexture;
            } else {
                const imagePath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$copySearchParams$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["copySearchParams"])(basePath + (imageFilename !== null && imageFilename !== void 0 ? imageFilename : asset.meta.image), options.src);
                const assets = await loader.load([
                    {
                        src: imagePath,
                        data: textureOptions
                    }
                ]);
                texture = assets[imagePath];
            }
            const spritesheet = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$spritesheet$2f$Spritesheet$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Spritesheet"]({
                texture: texture.source,
                data: asset,
                cachePrefix
            });
            await spritesheet.parse();
            const multiPacks = asset === null || asset === void 0 ? void 0 : (_asset_meta = asset.meta) === null || _asset_meta === void 0 ? void 0 : _asset_meta.related_multi_packs;
            if (Array.isArray(multiPacks)) {
                const promises = [];
                for (const item of multiPacks){
                    var _options_data1;
                    if (typeof item !== "string") {
                        continue;
                    }
                    let itemUrl = basePath + item;
                    if ((_options_data1 = options.data) === null || _options_data1 === void 0 ? void 0 : _options_data1.ignoreMultiPack) {
                        continue;
                    }
                    itemUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$copySearchParams$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["copySearchParams"])(itemUrl, options.src);
                    promises.push(loader.load({
                        src: itemUrl,
                        data: {
                            textureOptions,
                            ignoreMultiPack: true
                        }
                    }));
                }
                const res = await Promise.all(promises);
                spritesheet.linkedSheets = res;
                res.forEach((item)=>{
                    item.linkedSheets = [
                        spritesheet
                    ].concat(spritesheet.linkedSheets.filter((sp)=>sp !== item));
                });
            }
            return spritesheet;
        },
        async unload (spritesheet, _resolvedAsset, loader) {
            await loader.unload(spritesheet.textureSource._sourceOrigin);
            spritesheet.destroy(false);
        }
    }
};
;
 //# sourceMappingURL=spritesheetAsset.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/spritesheet/init.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$spritesheet$2f$spritesheetAsset$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/spritesheet/spritesheetAsset.mjs [app-client] (ecmascript)");
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$spritesheet$2f$spritesheetAsset$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spritesheetAsset"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/index.mjs [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2d$browser$2f$browserExt$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment-browser/browserExt.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2d$webworker$2f$webworkerExt$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment-webworker/webworkerExt.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$init$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/init.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$spritesheet$2f$init$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/spritesheet/init.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$utils$2f$textureFrom$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/textureFrom.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
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
;
;
;
;
;
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2d$browser$2f$browserExt$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["browserExt"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2d$webworker$2f$webworkerExt$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["webworkerExt"]);
;
 //# sourceMappingURL=index.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/app/Application.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Application",
    ()=>Application
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$autoDetectRenderer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/autoDetectRenderer.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/Container.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$global$2f$globalHooks$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/global/globalHooks.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
;
;
;
;
;
"use strict";
const _Application = class _Application {
    /**
   * Initializes the PixiJS application with the specified options.
   *
   * This method must be called after creating a new Application instance.
   * @param options - Configuration options for the application and renderer
   * @returns A promise that resolves when initialization is complete
   * @example
   * ```js
   * const app = new Application();
   *
   * // Initialize with custom options
   * await app.init({
   *     width: 800,
   *     height: 600,
   *     backgroundColor: 0x1099bb,
   *     preference: 'webgl', // or 'webgpu'
   * });
   * ```
   */ async init(options) {
        options = {
            ...options
        };
        this.renderer = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$autoDetectRenderer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["autoDetectRenderer"])(options);
        _Application._plugins.forEach((plugin)=>{
            plugin.init.call(this, options);
        });
    }
    /**
   * Renders the current stage to the screen.
   *
   * When using the default setup with {@link TickerPlugin} (enabled by default), you typically don't need to call
   * this method directly as rendering is handled automatically.
   *
   * Only use this method if you've disabled the {@link TickerPlugin} or need custom
   * render timing control.
   * @example
   * ```js
   * // Example 1: Default setup (TickerPlugin handles rendering)
   * const app = new Application();
   * await app.init();
   * // No need to call render() - TickerPlugin handles it
   *
   * // Example 2: Custom rendering loop (if TickerPlugin is disabled)
   * const app = new Application();
   * await app.init({ autoStart: false }); // Disable automatic rendering
   *
   * function animate() {
   *     app.render();
   *     requestAnimationFrame(animate);
   * }
   * animate();
   * ```
   */ render() {
        this.renderer.render({
            container: this.stage
        });
    }
    /**
   * Reference to the renderer's canvas element. This is the HTML element
   * that displays your application's graphics.
   * @readonly
   * @type {HTMLCanvasElement}
   * @example
   * ```js
   * // Create a new application
   * const app = new Application();
   * // Initialize the application
   * await app.init({...});
   * // Add canvas to the page
   * document.body.appendChild(app.canvas);
   *
   * // Access the canvas directly
   * console.log(app.canvas); // HTMLCanvasElement
   * ```
   */ get canvas() {
        return this.renderer.canvas;
    }
    /**
   * Reference to the renderer's canvas element.
   * @type {HTMLCanvasElement}
   * @deprecated since 8.0.0
   * @see {@link Application#canvas}
   */ get view() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "Application.view is deprecated, please use Application.canvas instead.");
        return this.renderer.canvas;
    }
    /**
   * Reference to the renderer's screen rectangle. This represents the visible area of your application.
   *
   * It's commonly used for:
   * - Setting filter areas for full-screen effects
   * - Defining hit areas for screen-wide interaction
   * - Determining the visible bounds of your application
   * @readonly
   * @example
   * ```js
   * // Use as filter area for a full-screen effect
   * const blurFilter = new BlurFilter();
   * sprite.filterArea = app.screen;
   *
   * // Use as hit area for screen-wide interaction
   * const screenSprite = new Sprite();
   * screenSprite.hitArea = app.screen;
   *
   * // Get screen dimensions
   * console.log(app.screen.width, app.screen.height);
   * ```
   * @see {@link Rectangle} For all available properties and methods
   */ get screen() {
        return this.renderer.screen;
    }
    /**
   * Destroys the application and all of its resources.
   *
   * This method should be called when you want to completely
   * clean up the application and free all associated memory.
   * @param rendererDestroyOptions - Options for destroying the renderer:
   *  - `false` or `undefined`: Preserves the canvas element (default)
   *  - `true`: Removes the canvas element
   *  - `{ removeView: boolean }`: Object with removeView property to control canvas removal
   * @param options - Options for destroying the application:
   *  - `false` or `undefined`: Basic cleanup (default)
   *  - `true`: Complete cleanup including children
   *  - Detailed options object:
   *    - `children`: Remove children
   *    - `texture`: Destroy textures
   *    - `textureSource`: Destroy texture sources
   *    - `context`: Destroy WebGL context
   * @example
   * ```js
   * // Basic cleanup
   * app.destroy();
   *
   * // Remove canvas and do complete cleanup
   * app.destroy(true, true);
   *
   * // Remove canvas with explicit options
   * app.destroy({ removeView: true }, true);
   *
   * // Detailed cleanup with specific options
   * app.destroy(
   *     { removeView: true },
   *     {
   *         children: true,
   *         texture: true,
   *         textureSource: true,
   *         context: true
   *     }
   * );
   * ```
   * > [!WARNING] After calling destroy, the application instance should no longer be used.
   * > All properties will be null and further operations will throw errors.
   */ destroy() {
        let rendererDestroyOptions = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false, options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        const plugins = _Application._plugins.slice(0);
        plugins.reverse();
        plugins.forEach((plugin)=>{
            plugin.destroy.call(this);
        });
        this.stage.destroy(options);
        this.stage = null;
        this.renderer.destroy(rendererDestroyOptions);
        this.renderer = null;
    }
    constructor(...args){
        /**
     * The root display container for your application.
     * All visual elements should be added to this container or its children.
     * @example
     * ```js
     * // Create a sprite and add it to the stage
     * const sprite = Sprite.from('image.png');
     * app.stage.addChild(sprite);
     *
     * // Create a container for grouping objects
     * const container = new Container();
     * app.stage.addChild(container);
     * ```
     */ this.stage = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"]();
        if (args[0] !== void 0) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "Application constructor options are deprecated, please use Application.init() instead.");
        }
    }
};
/**
 * Collection of installed plugins.
 * @internal
 */ _Application._plugins = [];
let Application = _Application;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].handleByList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].Application, Application._plugins);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$global$2f$globalHooks$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApplicationInitHook"]);
;
 //# sourceMappingURL=Application.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/_virtual/checkImageBitmap.worker.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WorkerInstance
]);
const WORKER_CODE = "(function () {\n    'use strict';\n\n    const WHITE_PNG = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=\";\n    async function checkImageBitmap() {\n      try {\n        if (typeof createImageBitmap !== \"function\")\n          return false;\n        const response = await fetch(WHITE_PNG);\n        const imageBlob = await response.blob();\n        const imageBitmap = await createImageBitmap(imageBlob);\n        return imageBitmap.width === 1 && imageBitmap.height === 1;\n      } catch (_e) {\n        return false;\n      }\n    }\n    void checkImageBitmap().then((result) => {\n      self.postMessage(result);\n    });\n\n})();\n";
let WORKER_URL = null;
class WorkerInstance {
    constructor(){
        if (!WORKER_URL) {
            WORKER_URL = URL.createObjectURL(new Blob([
                WORKER_CODE
            ], {
                type: 'application/javascript'
            }));
        }
        this.worker = new Worker(WORKER_URL);
    }
}
WorkerInstance.revokeObjectURL = function revokeObjectURL() {
    if (WORKER_URL) {
        URL.revokeObjectURL(WORKER_URL);
        WORKER_URL = null;
    }
};
;
 //# sourceMappingURL=checkImageBitmap.worker.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/_virtual/loadImageBitmap.worker.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WorkerInstance
]);
const WORKER_CODE = "(function () {\n    'use strict';\n\n    async function loadImageBitmap(url, alphaMode) {\n      const response = await fetch(url);\n      if (!response.ok) {\n        throw new Error(`[WorkerManager.loadImageBitmap] Failed to fetch ${url}: ${response.status} ${response.statusText}`);\n      }\n      const imageBlob = await response.blob();\n      return alphaMode === \"premultiplied-alpha\" ? createImageBitmap(imageBlob, { premultiplyAlpha: \"none\" }) : createImageBitmap(imageBlob);\n    }\n    self.onmessage = async (event) => {\n      try {\n        const imageBitmap = await loadImageBitmap(event.data.data[0], event.data.data[1]);\n        self.postMessage({\n          data: imageBitmap,\n          uuid: event.data.uuid,\n          id: event.data.id\n        }, [imageBitmap]);\n      } catch (e) {\n        self.postMessage({\n          error: e,\n          uuid: event.data.uuid,\n          id: event.data.id\n        });\n      }\n    };\n\n})();\n";
let WORKER_URL = null;
class WorkerInstance {
    constructor(){
        if (!WORKER_URL) {
            WORKER_URL = URL.createObjectURL(new Blob([
                WORKER_CODE
            ], {
                type: 'application/javascript'
            }));
        }
        this.worker = new Worker(WORKER_URL);
    }
}
WorkerInstance.revokeObjectURL = function revokeObjectURL() {
    if (WORKER_URL) {
        URL.revokeObjectURL(WORKER_URL);
        WORKER_URL = null;
    }
};
;
 //# sourceMappingURL=loadImageBitmap.worker.mjs.map
}),
]);

//# sourceMappingURL=5703a_pixi_js_lib_b81fc7f4._.js.map