(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureStyle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TextureStyle",
    ()=>TextureStyle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
const idHash = /* @__PURE__ */ Object.create(null);
function createResourceIdFromString(value) {
    const id = idHash[value];
    if (id === void 0) {
        idHash[value] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("resource");
    }
    return id;
}
const _TextureStyle = class _TextureStyle extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    set addressMode(value) {
        this.addressModeU = value;
        this.addressModeV = value;
        this.addressModeW = value;
    }
    /** setting this will set wrapModeU,wrapModeV and wrapModeW all at once! */ get addressMode() {
        return this.addressModeU;
    }
    set wrapMode(value) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "TextureStyle.wrapMode is now TextureStyle.addressMode");
        this.addressMode = value;
    }
    get wrapMode() {
        return this.addressMode;
    }
    set scaleMode(value) {
        this.magFilter = value;
        this.minFilter = value;
        this.mipmapFilter = value;
    }
    /** setting this will set magFilter,minFilter and mipmapFilter all at once!  */ get scaleMode() {
        return this.magFilter;
    }
    /** Specifies the maximum anisotropy value clamp used by the sampler. */ set maxAnisotropy(value) {
        this._maxAnisotropy = Math.min(value, 16);
        if (this._maxAnisotropy > 1) {
            this.scaleMode = "linear";
        }
    }
    get maxAnisotropy() {
        return this._maxAnisotropy;
    }
    // TODO - move this to WebGL?
    get _resourceId() {
        return this._sharedResourceId || this._generateResourceId();
    }
    update() {
        this.emit("change", this);
        this._sharedResourceId = null;
    }
    _generateResourceId() {
        const bigKey = "".concat(this.addressModeU, "-").concat(this.addressModeV, "-").concat(this.addressModeW, "-").concat(this.magFilter, "-").concat(this.minFilter, "-").concat(this.mipmapFilter, "-").concat(this.lodMinClamp, "-").concat(this.lodMaxClamp, "-").concat(this.compare, "-").concat(this._maxAnisotropy);
        this._sharedResourceId = createResourceIdFromString(bigKey);
        return this._resourceId;
    }
    /** Destroys the style */ destroy() {
        this.destroyed = true;
        this.emit("destroy", this);
        this.emit("change", this);
        this.removeAllListeners();
    }
    /**
   * @param options - options for the style
   */ constructor(options = {}){
        super();
        /** @internal */ this._resourceType = "textureSampler";
        /** @internal */ this._touched = 0;
        /**
     * Specifies the maximum anisotropy value clamp used by the sampler.
     * Note: Most implementations support {@link TextureStyle#maxAnisotropy} values in range
     * between 1 and 16, inclusive. The used value of {@link TextureStyle#maxAnisotropy} will
     * be clamped to the maximum value that the platform supports.
     * @internal
     */ this._maxAnisotropy = 1;
        /**
     * Has the style been destroyed?
     * @readonly
     */ this.destroyed = false;
        options = {
            ..._TextureStyle.defaultOptions,
            ...options
        };
        this.addressMode = options.addressMode;
        var _options_addressModeU;
        this.addressModeU = (_options_addressModeU = options.addressModeU) !== null && _options_addressModeU !== void 0 ? _options_addressModeU : this.addressModeU;
        var _options_addressModeV;
        this.addressModeV = (_options_addressModeV = options.addressModeV) !== null && _options_addressModeV !== void 0 ? _options_addressModeV : this.addressModeV;
        var _options_addressModeW;
        this.addressModeW = (_options_addressModeW = options.addressModeW) !== null && _options_addressModeW !== void 0 ? _options_addressModeW : this.addressModeW;
        this.scaleMode = options.scaleMode;
        var _options_magFilter;
        this.magFilter = (_options_magFilter = options.magFilter) !== null && _options_magFilter !== void 0 ? _options_magFilter : this.magFilter;
        var _options_minFilter;
        this.minFilter = (_options_minFilter = options.minFilter) !== null && _options_minFilter !== void 0 ? _options_minFilter : this.minFilter;
        var _options_mipmapFilter;
        this.mipmapFilter = (_options_mipmapFilter = options.mipmapFilter) !== null && _options_mipmapFilter !== void 0 ? _options_mipmapFilter : this.mipmapFilter;
        this.lodMinClamp = options.lodMinClamp;
        this.lodMaxClamp = options.lodMaxClamp;
        this.compare = options.compare;
        var _options_maxAnisotropy;
        this.maxAnisotropy = (_options_maxAnisotropy = options.maxAnisotropy) !== null && _options_maxAnisotropy !== void 0 ? _options_maxAnisotropy : 1;
    }
};
/** default options for the style */ _TextureStyle.defaultOptions = {
    addressMode: "clamp-to-edge",
    scaleMode: "linear"
};
let TextureStyle = _TextureStyle;
;
 //# sourceMappingURL=TextureStyle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TextureSource",
    ()=>TextureSource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/misc/pow2.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$definedProps$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/definedProps.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureStyle.mjs [app-client] (ecmascript)");
;
;
;
;
;
"use strict";
const _TextureSource = class _TextureSource extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    /** returns itself */ get source() {
        return this;
    }
    /** the style of the texture */ get style() {
        return this._style;
    }
    set style(value) {
        var _this__style, _this__style1;
        if (this.style === value) return;
        (_this__style = this._style) === null || _this__style === void 0 ? void 0 : _this__style.off("change", this._onStyleChange, this);
        this._style = value;
        (_this__style1 = this._style) === null || _this__style1 === void 0 ? void 0 : _this__style1.on("change", this._onStyleChange, this);
        this._onStyleChange();
    }
    /** Specifies the maximum anisotropy value clamp used by the sampler. */ set maxAnisotropy(value) {
        this._style.maxAnisotropy = value;
    }
    get maxAnisotropy() {
        return this._style.maxAnisotropy;
    }
    /** setting this will set wrapModeU, wrapModeV and wrapModeW all at once! */ get addressMode() {
        return this._style.addressMode;
    }
    set addressMode(value) {
        this._style.addressMode = value;
    }
    /** setting this will set wrapModeU, wrapModeV and wrapModeW all at once! */ get repeatMode() {
        return this._style.addressMode;
    }
    set repeatMode(value) {
        this._style.addressMode = value;
    }
    /** Specifies the sampling behavior when the sample footprint is smaller than or equal to one texel. */ get magFilter() {
        return this._style.magFilter;
    }
    set magFilter(value) {
        this._style.magFilter = value;
    }
    /** Specifies the sampling behavior when the sample footprint is larger than one texel. */ get minFilter() {
        return this._style.minFilter;
    }
    set minFilter(value) {
        this._style.minFilter = value;
    }
    /** Specifies behavior for sampling between mipmap levels. */ get mipmapFilter() {
        return this._style.mipmapFilter;
    }
    set mipmapFilter(value) {
        this._style.mipmapFilter = value;
    }
    /** Specifies the minimum and maximum levels of detail, respectively, used internally when sampling a texture. */ get lodMinClamp() {
        return this._style.lodMinClamp;
    }
    set lodMinClamp(value) {
        this._style.lodMinClamp = value;
    }
    /** Specifies the minimum and maximum levels of detail, respectively, used internally when sampling a texture. */ get lodMaxClamp() {
        return this._style.lodMaxClamp;
    }
    set lodMaxClamp(value) {
        this._style.lodMaxClamp = value;
    }
    _onStyleChange() {
        this.emit("styleChange", this);
    }
    /** call this if you have modified the texture outside of the constructor */ update() {
        if (this.resource) {
            const resolution = this._resolution;
            const didResize = this.resize(this.resourceWidth / resolution, this.resourceHeight / resolution);
            if (didResize) return;
        }
        this.emit("update", this);
    }
    /** Destroys this texture source */ destroy() {
        this.destroyed = true;
        this.emit("destroy", this);
        this.emit("change", this);
        if (this._style) {
            this._style.destroy();
            this._style = null;
        }
        this.uploadMethodId = null;
        this.resource = null;
        this.removeAllListeners();
    }
    /**
   * This will unload the Texture source from the GPU. This will free up the GPU memory
   * As soon as it is required fore rendering, it will be re-uploaded.
   */ unload() {
        this._resourceId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("resource");
        this.emit("change", this);
        this.emit("unload", this);
    }
    /** the width of the resource. This is the REAL pure number, not accounting resolution   */ get resourceWidth() {
        const { resource } = this;
        return resource.naturalWidth || resource.videoWidth || resource.displayWidth || resource.width;
    }
    /** the height of the resource. This is the REAL pure number, not accounting resolution */ get resourceHeight() {
        const { resource } = this;
        return resource.naturalHeight || resource.videoHeight || resource.displayHeight || resource.height;
    }
    /**
   * the resolution of the texture. Changing this number, will not change the number of pixels in the actual texture
   * but will the size of the texture when rendered.
   *
   * changing the resolution of this texture to 2 for example will make it appear twice as small when rendered (as pixel
   * density will have increased)
   */ get resolution() {
        return this._resolution;
    }
    set resolution(resolution) {
        if (this._resolution === resolution) return;
        this._resolution = resolution;
        this.width = this.pixelWidth / resolution;
        this.height = this.pixelHeight / resolution;
    }
    /**
   * Resize the texture, this is handy if you want to use the texture as a render texture
   * @param width - the new width of the texture
   * @param height - the new height of the texture
   * @param resolution - the new resolution of the texture
   * @returns - if the texture was resized
   */ resize(width, height, resolution) {
        resolution || (resolution = this._resolution);
        width || (width = this.width);
        height || (height = this.height);
        const newPixelWidth = Math.round(width * resolution);
        const newPixelHeight = Math.round(height * resolution);
        this.width = newPixelWidth / resolution;
        this.height = newPixelHeight / resolution;
        this._resolution = resolution;
        if (this.pixelWidth === newPixelWidth && this.pixelHeight === newPixelHeight) {
            return false;
        }
        this._refreshPOT();
        this.pixelWidth = newPixelWidth;
        this.pixelHeight = newPixelHeight;
        this.emit("resize", this);
        this._resourceId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("resource");
        this.emit("change", this);
        return true;
    }
    /**
   * Lets the renderer know that this texture has been updated and its mipmaps should be re-generated.
   * This is only important for RenderTexture instances, as standard Texture instances will have their
   * mipmaps generated on upload. You should call this method after you make any change to the texture
   *
   * The reason for this is is can be quite expensive to update mipmaps for a texture. So by default,
   * We want you, the developer to specify when this action should happen.
   *
   * Generally you don't want to have mipmaps generated on Render targets that are changed every frame,
   */ updateMipmaps() {
        if (this.autoGenerateMipmaps && this.mipLevelCount > 1) {
            this.emit("updateMipmaps", this);
        }
    }
    set wrapMode(value) {
        this._style.wrapMode = value;
    }
    get wrapMode() {
        return this._style.wrapMode;
    }
    set scaleMode(value) {
        this._style.scaleMode = value;
    }
    /** setting this will set magFilter,minFilter and mipmapFilter all at once!  */ get scaleMode() {
        return this._style.scaleMode;
    }
    /**
   * Refresh check for isPowerOfTwo texture based on size
   * @private
   */ _refreshPOT() {
        this.isPowerOfTwo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isPow2"])(this.pixelWidth) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isPow2"])(this.pixelHeight);
    }
    static test(_resource) {
        throw new Error("Unimplemented");
    }
    /**
   * @param options - options for creating a new TextureSource
   */ constructor(options = {}){
        super();
        this.options = options;
        /** unique id for this Texture source */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("textureSource");
        /**
     * The resource type used by this TextureSource. This is used by the bind groups to determine
     * how to handle this resource.
     * @internal
     */ this._resourceType = "textureSource";
        /**
     * i unique resource id, used by the bind group systems.
     * This can change if the texture is resized or its resource changes
     * @internal
     */ this._resourceId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("resource");
        /**
     * this is how the backends know how to upload this texture to the GPU
     * It changes depending on the resource type. Classes that extend TextureSource
     * should override this property.
     * @internal
     */ this.uploadMethodId = "unknown";
        /** @internal */ this._resolution = 1;
        /** the pixel width of this texture source. This is the REAL pure number, not accounting resolution */ this.pixelWidth = 1;
        /** the pixel height of this texture source. This is the REAL pure number, not accounting resolution */ this.pixelHeight = 1;
        /**
     * the width of this texture source, accounting for resolution
     * eg pixelWidth 200, resolution 2, then width will be 100
     */ this.width = 1;
        /**
     * the height of this texture source, accounting for resolution
     * eg pixelHeight 200, resolution 2, then height will be 100
     */ this.height = 1;
        /**
     * The number of samples of a multisample texture. This is always 1 for non-multisample textures.
     * To enable multisample for a texture, set antialias to true
     * @internal
     */ this.sampleCount = 1;
        /** The number of mip levels to generate for this texture. this is  overridden if autoGenerateMipmaps is true */ this.mipLevelCount = 1;
        /**
     * Should we auto generate mipmaps for this texture? This will automatically generate mipmaps
     * for this texture when uploading to the GPU. Mipmapped textures take up more memory, but
     * can look better when scaled down.
     *
     * For performance reasons, it is recommended to NOT use this with RenderTextures, as they are often updated every frame.
     * If you do, make sure to call `updateMipmaps` after you update the texture.
     */ this.autoGenerateMipmaps = false;
        /** the format that the texture data has */ this.format = "rgba8unorm";
        /** how many dimensions does this texture have? currently v8 only supports 2d */ this.dimension = "2d";
        /**
     * Only really affects RenderTextures.
     * Should we use antialiasing for this texture. It will look better, but may impact performance as a
     * Blit operation will be required to resolve the texture.
     */ this.antialias = false;
        /**
     * Used by automatic texture Garbage Collection, stores last GC tick when it was bound
     * @protected
     */ this._touched = 0;
        /**
     * Used by the batcher to build texture batches. faster to have the variable here!
     * @protected
     */ this._batchTick = -1;
        /**
     * A temporary batch location for the texture batching. Here for performance reasons only!
     * @protected
     */ this._textureBindLocation = -1;
        options = {
            ..._TextureSource.defaultOptions,
            ...options
        };
        var _options_label;
        this.label = (_options_label = options.label) !== null && _options_label !== void 0 ? _options_label : "";
        this.resource = options.resource;
        this.autoGarbageCollect = options.autoGarbageCollect;
        this._resolution = options.resolution;
        if (options.width) {
            this.pixelWidth = options.width * this._resolution;
        } else {
            var _this_resourceWidth;
            this.pixelWidth = this.resource ? (_this_resourceWidth = this.resourceWidth) !== null && _this_resourceWidth !== void 0 ? _this_resourceWidth : 1 : 1;
        }
        if (options.height) {
            this.pixelHeight = options.height * this._resolution;
        } else {
            var _this_resourceHeight;
            this.pixelHeight = this.resource ? (_this_resourceHeight = this.resourceHeight) !== null && _this_resourceHeight !== void 0 ? _this_resourceHeight : 1 : 1;
        }
        this.width = this.pixelWidth / this._resolution;
        this.height = this.pixelHeight / this._resolution;
        this.format = options.format;
        this.dimension = options.dimensions;
        this.mipLevelCount = options.mipLevelCount;
        this.autoGenerateMipmaps = options.autoGenerateMipmaps;
        this.sampleCount = options.sampleCount;
        this.antialias = options.antialias;
        this.alphaMode = options.alphaMode;
        this.style = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureStyle"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$definedProps$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["definedProps"])(options));
        this.destroyed = false;
        this._refreshPOT();
    }
};
/** The default options used when creating a new TextureSource. override these to add your own defaults */ _TextureSource.defaultOptions = {
    resolution: 1,
    format: "bgra8unorm",
    alphaMode: "premultiply-alpha-on-upload",
    dimensions: "2d",
    mipLevelCount: 1,
    autoGenerateMipmaps: false,
    sampleCount: 1,
    antialias: false,
    autoGarbageCollect: false
};
let TextureSource = _TextureSource;
;
 //# sourceMappingURL=TextureSource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/BufferImageSource.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BufferImageSource",
    ()=>BufferImageSource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-client] (ecmascript)");
;
;
"use strict";
class BufferImageSource extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureSource"] {
    static test(resource) {
        return resource instanceof Int8Array || resource instanceof Uint8Array || resource instanceof Uint8ClampedArray || resource instanceof Int16Array || resource instanceof Uint16Array || resource instanceof Int32Array || resource instanceof Uint32Array || resource instanceof Float32Array;
    }
    constructor(options){
        const buffer = options.resource || new Float32Array(options.width * options.height * 4);
        let format = options.format;
        if (!format) {
            if (buffer instanceof Float32Array) {
                format = "rgba32float";
            } else if (buffer instanceof Int32Array) {
                format = "rgba32uint";
            } else if (buffer instanceof Uint32Array) {
                format = "rgba32uint";
            } else if (buffer instanceof Int16Array) {
                format = "rgba16uint";
            } else if (buffer instanceof Uint16Array) {
                format = "rgba16uint";
            } else if (buffer instanceof Int8Array) {
                format = "bgra8unorm";
            } else {
                format = "bgra8unorm";
            }
        }
        super({
            ...options,
            resource: buffer,
            format
        });
        this.uploadMethodId = "buffer";
    }
}
BufferImageSource.extension = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].TextureSource;
;
 //# sourceMappingURL=BufferImageSource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureMatrix.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TextureMatrix",
    ()=>TextureMatrix
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
;
"use strict";
const tempMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
class TextureMatrix {
    /** Texture property. */ get texture() {
        return this._texture;
    }
    set texture(value) {
        var _this__texture;
        if (this.texture === value) return;
        (_this__texture = this._texture) === null || _this__texture === void 0 ? void 0 : _this__texture.removeListener("update", this.update, this);
        this._texture = value;
        this._texture.addListener("update", this.update, this);
        this.update();
    }
    /**
   * Multiplies uvs array to transform
   * @param uvs - mesh uvs
   * @param [out=uvs] - output
   * @returns - output
   */ multiplyUvs(uvs, out) {
        if (out === void 0) {
            out = uvs;
        }
        const mat = this.mapCoord;
        for(let i = 0; i < uvs.length; i += 2){
            const x = uvs[i];
            const y = uvs[i + 1];
            out[i] = x * mat.a + y * mat.c + mat.tx;
            out[i + 1] = x * mat.b + y * mat.d + mat.ty;
        }
        return out;
    }
    /**
   * Updates matrices if texture was changed
   * @returns - whether or not it was updated
   */ update() {
        const tex = this._texture;
        this._updateID++;
        const uvs = tex.uvs;
        this.mapCoord.set(uvs.x1 - uvs.x0, uvs.y1 - uvs.y0, uvs.x3 - uvs.x0, uvs.y3 - uvs.y0, uvs.x0, uvs.y0);
        const orig = tex.orig;
        const trim = tex.trim;
        if (trim) {
            tempMat.set(orig.width / trim.width, 0, 0, orig.height / trim.height, -trim.x / trim.width, -trim.y / trim.height);
            this.mapCoord.append(tempMat);
        }
        const texBase = tex.source;
        const frame = this.uClampFrame;
        const margin = this.clampMargin / texBase._resolution;
        const offset = this.clampOffset / texBase._resolution;
        frame[0] = (tex.frame.x + margin + offset) / texBase.width;
        frame[1] = (tex.frame.y + margin + offset) / texBase.height;
        frame[2] = (tex.frame.x + tex.frame.width - margin + offset) / texBase.width;
        frame[3] = (tex.frame.y + tex.frame.height - margin + offset) / texBase.height;
        this.uClampOffset[0] = this.clampOffset / texBase.pixelWidth;
        this.uClampOffset[1] = this.clampOffset / texBase.pixelHeight;
        this.isSimple = tex.frame.width === texBase.width && tex.frame.height === texBase.height && tex.rotate === 0;
        return true;
    }
    /**
   * @param texture - observed texture
   * @param clampMargin - Changes frame clamping, 0.5 by default. Use -0.5 for extra border.
   */ constructor(texture, clampMargin){
        this.mapCoord = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
        this.uClampFrame = new Float32Array(4);
        this.uClampOffset = new Float32Array(2);
        this._textureID = -1;
        this._updateID = 0;
        this.clampOffset = 0;
        if (typeof clampMargin === "undefined") {
            this.clampMargin = texture.width < 10 ? 0 : 0.5;
        } else {
            this.clampMargin = clampMargin;
        }
        this.isSimple = false;
        this.texture = texture;
    }
}
;
 //# sourceMappingURL=TextureMatrix.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Texture",
    ()=>Texture
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/groupD8.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$misc$2f$NOOP$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/misc/NOOP.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$BufferImageSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/BufferImageSource.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureMatrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureMatrix.mjs [app-client] (ecmascript)");
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
class Texture extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    set source(value) {
        if (this._source) {
            this._source.off("resize", this.update, this);
        }
        this._source = value;
        value.on("resize", this.update, this);
        this.emit("update", this);
    }
    /** the underlying source of the texture (equivalent of baseTexture in v7) */ get source() {
        return this._source;
    }
    /** returns a TextureMatrix instance for this texture. By default, that object is not created because its heavy. */ get textureMatrix() {
        if (!this._textureMatrix) {
            this._textureMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureMatrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureMatrix"](this);
        }
        return this._textureMatrix;
    }
    /** The width of the Texture in pixels. */ get width() {
        return this.orig.width;
    }
    /** The height of the Texture in pixels. */ get height() {
        return this.orig.height;
    }
    /** Call this function when you have modified the frame of this texture. */ updateUvs() {
        const { uvs, frame } = this;
        const { width, height } = this._source;
        const nX = frame.x / width;
        const nY = frame.y / height;
        const nW = frame.width / width;
        const nH = frame.height / height;
        let rotate = this.rotate;
        if (rotate) {
            const w2 = nW / 2;
            const h2 = nH / 2;
            const cX = nX + w2;
            const cY = nY + h2;
            rotate = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].add(rotate, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].NW);
            uvs.x0 = cX + w2 * __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].uX(rotate);
            uvs.y0 = cY + h2 * __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].uY(rotate);
            rotate = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].add(rotate, 2);
            uvs.x1 = cX + w2 * __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].uX(rotate);
            uvs.y1 = cY + h2 * __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].uY(rotate);
            rotate = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].add(rotate, 2);
            uvs.x2 = cX + w2 * __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].uX(rotate);
            uvs.y2 = cY + h2 * __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].uY(rotate);
            rotate = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].add(rotate, 2);
            uvs.x3 = cX + w2 * __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].uX(rotate);
            uvs.y3 = cY + h2 * __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].uY(rotate);
        } else {
            uvs.x0 = nX;
            uvs.y0 = nY;
            uvs.x1 = nX + nW;
            uvs.y1 = nY;
            uvs.x2 = nX + nW;
            uvs.y2 = nY + nH;
            uvs.x3 = nX;
            uvs.y3 = nY + nH;
        }
    }
    /**
   * Destroys this texture
   * @param destroySource - Destroy the source when the texture is destroyed.
   */ destroy() {
        let destroySource = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        if (this._source) {
            if (destroySource) {
                this._source.destroy();
                this._source = null;
            }
        }
        this._textureMatrix = null;
        this.destroyed = true;
        this.emit("destroy", this);
        this.removeAllListeners();
    }
    /**
   * Call this if you have modified the `texture outside` of the constructor.
   *
   * If you have modified this texture's source, you must separately call `texture.source.update()` to see those changes.
   */ update() {
        if (this.noFrame) {
            this.frame.width = this._source.width;
            this.frame.height = this._source.height;
        }
        this.updateUvs();
        this.emit("update", this);
    }
    /** @deprecated since 8.0.0 */ get baseTexture() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "Texture.baseTexture is now Texture.source");
        return this._source;
    }
    /**
   * @param {TextureOptions} options - Options for the texture
   */ constructor({ source, label, frame, orig, trim, defaultAnchor, defaultBorders, rotate, dynamic } = {}){
        super();
        /** unique id for this texture */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("texture");
        /** A uvs object based on the given frame and the texture source */ this.uvs = {
            x0: 0,
            y0: 0,
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
            x3: 0,
            y3: 0
        };
        /**
     * This is the area of the BaseTexture image to actually copy to the Canvas / WebGL when rendering,
     * irrespective of the actual frame size or placement (which can be influenced by trimmed texture atlases)
     */ this.frame = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"]();
        /**
     * Does this Texture have any frame data assigned to it?
     *
     * This mode is enabled automatically if no frame was passed inside constructor.
     *
     * In this mode texture is subscribed to baseTexture events, and fires `update` on any change.
     *
     * Beware, after loading or resize of baseTexture event can fired two times!
     * If you want more control, subscribe on baseTexture itself.
     * @example
     * texture.on('update', () => {});
     */ this.noFrame = false;
        /**
     * Set to true if you plan on modifying the uvs of this texture.
     * When this is the case, sprites and other objects using the texture will
     * make sure to listen for changes to the uvs and update their vertices accordingly.
     */ this.dynamic = false;
        /** is it a texture? yes! used for type checking */ this.isTexture = true;
        this.label = label;
        var _source_source;
        this.source = (_source_source = source === null || source === void 0 ? void 0 : source.source) !== null && _source_source !== void 0 ? _source_source : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureSource"]();
        this.noFrame = !frame;
        if (frame) {
            this.frame.copyFrom(frame);
        } else {
            const { width, height } = this._source;
            this.frame.width = width;
            this.frame.height = height;
        }
        this.orig = orig || this.frame;
        this.trim = trim;
        this.rotate = rotate !== null && rotate !== void 0 ? rotate : 0;
        this.defaultAnchor = defaultAnchor;
        this.defaultBorders = defaultBorders;
        this.destroyed = false;
        this.dynamic = dynamic || false;
        this.updateUvs();
    }
}
Texture.EMPTY = new Texture({
    label: "EMPTY",
    source: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureSource"]({
        label: "EMPTY"
    })
});
Texture.EMPTY.destroy = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$misc$2f$NOOP$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NOOP"];
Texture.WHITE = new Texture({
    source: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$BufferImageSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferImageSource"]({
        resource: new Uint8Array([
            255,
            255,
            255,
            255
        ]),
        width: 1,
        height: 1,
        alphaMode: "premultiply-alpha-on-upload",
        label: "WHITE"
    }),
    label: "WHITE"
});
Texture.WHITE.destroy = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$misc$2f$NOOP$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NOOP"];
;
 //# sourceMappingURL=Texture.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/MaskEffectManager.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MaskEffectManager",
    ()=>MaskEffectManager,
    "MaskEffectManagerClass",
    ()=>MaskEffectManagerClass
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-client] (ecmascript)");
;
;
"use strict";
class MaskEffectManagerClass {
    init() {
        if (this._initialized) return;
        this._initialized = true;
        this._effectClasses.forEach((test)=>{
            this.add({
                test: test.test,
                maskClass: test
            });
        });
    }
    add(test) {
        this._tests.push(test);
    }
    getMaskEffect(item) {
        if (!this._initialized) this.init();
        for(let i = 0; i < this._tests.length; i++){
            const test = this._tests[i];
            if (test.test(item)) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BigPool"].get(test.maskClass, item);
            }
        }
        return item;
    }
    returnMaskEffect(effect) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BigPool"].return(effect);
    }
    constructor(){
        /** @private */ this._effectClasses = [];
        this._tests = [];
        this._initialized = false;
    }
}
const MaskEffectManager = new MaskEffectManagerClass();
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].handleByList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].MaskEffect, MaskEffectManager._effectClasses);
;
 //# sourceMappingURL=MaskEffectManager.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/instructions/InstructionSet.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InstructionSet",
    ()=>InstructionSet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
;
"use strict";
class InstructionSet {
    /** reset the instruction set so it can be reused set size back to 0 */ reset() {
        this.instructionSize = 0;
    }
    /**
   * Destroy the instruction set, clearing the instructions and renderables.
   * @internal
   */ destroy() {
        this.instructions.length = 0;
        this.renderables.length = 0;
        this.renderPipes = null;
        this.gcTick = 0;
    }
    /**
   * Add an instruction to the set
   * @param instruction - add an instruction to the set
   */ add(instruction) {
        this.instructions[this.instructionSize++] = instruction;
    }
    /**
   * Log the instructions to the console (for debugging)
   * @internal
   */ log() {
        this.instructions.length = this.instructionSize;
        console.table(this.instructions, [
            "type",
            "action"
        ]);
    }
    constructor(){
        /** a unique id for this instruction set used through the renderer */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("instructionSet");
        /** the array of instructions */ this.instructions = [];
        /** the actual size of the array (any instructions passed this should be ignored) */ this.instructionSize = 0;
        this.renderables = [];
        /** used by the garbage collector to track when the instruction set was last used */ this.gcTick = 0;
    }
}
;
 //# sourceMappingURL=InstructionSet.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TexturePool.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TexturePool",
    ()=>TexturePool,
    "TexturePoolClass",
    ()=>TexturePoolClass
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/misc/pow2.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/GlobalResourceRegistry.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureStyle.mjs [app-client] (ecmascript)");
;
;
;
;
;
"use strict";
let count = 0;
class TexturePoolClass {
    /**
   * Creates texture with params that were specified in pool constructor.
   * @param pixelWidth - Width of texture in pixels.
   * @param pixelHeight - Height of texture in pixels.
   * @param antialias
   */ createTexture(pixelWidth, pixelHeight, antialias) {
        const textureSource = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureSource"]({
            ...this.textureOptions,
            width: pixelWidth,
            height: pixelHeight,
            resolution: 1,
            antialias,
            autoGarbageCollect: false
        });
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]({
            source: textureSource,
            label: "texturePool_".concat(count++)
        });
    }
    /**
   * Gets a Power-of-Two render texture or fullScreen texture
   * @param frameWidth - The minimum width of the render texture.
   * @param frameHeight - The minimum height of the render texture.
   * @param resolution - The resolution of the render texture.
   * @param antialias
   * @returns The new render texture.
   */ getOptimalTexture(frameWidth, frameHeight) {
        let resolution = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1, antialias = arguments.length > 3 ? arguments[3] : void 0;
        let po2Width = Math.ceil(frameWidth * resolution - 1e-6);
        let po2Height = Math.ceil(frameHeight * resolution - 1e-6);
        po2Width = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nextPow2"])(po2Width);
        po2Height = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nextPow2"])(po2Height);
        const key = (po2Width << 17) + (po2Height << 1) + (antialias ? 1 : 0);
        if (!this._texturePool[key]) {
            this._texturePool[key] = [];
        }
        let texture = this._texturePool[key].pop();
        if (!texture) {
            texture = this.createTexture(po2Width, po2Height, antialias);
        }
        texture.source._resolution = resolution;
        texture.source.width = po2Width / resolution;
        texture.source.height = po2Height / resolution;
        texture.source.pixelWidth = po2Width;
        texture.source.pixelHeight = po2Height;
        texture.frame.x = 0;
        texture.frame.y = 0;
        texture.frame.width = frameWidth;
        texture.frame.height = frameHeight;
        texture.updateUvs();
        this._poolKeyHash[texture.uid] = key;
        return texture;
    }
    /**
   * Gets extra texture of the same size as input renderTexture
   * @param texture - The texture to check what size it is.
   * @param antialias - Whether to use antialias.
   * @returns A texture that is a power of two
   */ getSameSizeTexture(texture) {
        let antialias = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        const source = texture.source;
        return this.getOptimalTexture(texture.width, texture.height, source._resolution, antialias);
    }
    /**
   * Place a render texture back into the pool. Optionally reset the style of the texture to the default texture style.
   * useful if you modified the style of the texture after getting it from the pool.
   * @param renderTexture - The renderTexture to free
   * @param resetStyle - Whether to reset the style of the texture to the default texture style
   */ returnTexture(renderTexture) {
        let resetStyle = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        const key = this._poolKeyHash[renderTexture.uid];
        if (resetStyle) {
            renderTexture.source.style = this.textureStyle;
        }
        this._texturePool[key].push(renderTexture);
    }
    /**
   * Clears the pool.
   * @param destroyTextures - Destroy all stored textures.
   */ clear(destroyTextures) {
        destroyTextures = destroyTextures !== false;
        if (destroyTextures) {
            for(const i in this._texturePool){
                const textures = this._texturePool[i];
                if (textures) {
                    for(let j = 0; j < textures.length; j++){
                        textures[j].destroy(true);
                    }
                }
            }
        }
        this._texturePool = {};
    }
    /**
   * @param textureOptions - options that will be passed to BaseRenderTexture constructor
   * @param {SCALE_MODE} [textureOptions.scaleMode] - See {@link SCALE_MODE} for possible values.
   */ constructor(textureOptions){
        this._poolKeyHash = /* @__PURE__ */ Object.create(null);
        this._texturePool = {};
        this.textureOptions = textureOptions || {};
        this.enableFullScreen = false;
        this.textureStyle = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureStyle"](this.textureOptions);
    }
}
const TexturePool = new TexturePoolClass();
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GlobalResourceRegistry"].register(TexturePool);
;
 //# sourceMappingURL=TexturePool.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/utils/addMaskBounds.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addMaskBounds",
    ()=>addMaskBounds
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getGlobalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getGlobalBounds.mjs [app-client] (ecmascript)");
;
;
"use strict";
const tempBounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Bounds"]();
function addMaskBounds(mask, bounds, skipUpdateTransform) {
    const boundsToMask = tempBounds;
    mask.measurable = true;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getGlobalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGlobalBounds"])(mask, skipUpdateTransform, boundsToMask);
    bounds.addBoundsMask(boundsToMask);
    mask.measurable = false;
}
;
 //# sourceMappingURL=addMaskBounds.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/utils/addMaskLocalBounds.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addMaskLocalBounds",
    ()=>addMaskLocalBounds
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getLocalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getLocalBounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/utils/matrixAndBoundsPool.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
function addMaskLocalBounds(mask, bounds, localRoot) {
    const boundsToMask = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["boundsPool"].get();
    mask.measurable = true;
    const tempMatrix = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].get().identity();
    const relativeMask = getMatrixRelativeToParent(mask, localRoot, tempMatrix);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getLocalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getLocalBounds"])(mask, boundsToMask, relativeMask);
    mask.measurable = false;
    bounds.addBoundsMask(boundsToMask);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].return(tempMatrix);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["boundsPool"].return(boundsToMask);
}
function getMatrixRelativeToParent(target, root, matrix) {
    if (!target) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])("Mask bounds, renderable is not inside the root container");
        return matrix;
    }
    if (target !== root) {
        getMatrixRelativeToParent(target.parent, root, matrix);
        target.updateLocalTransform();
        matrix.append(target.localTransform);
    }
    return matrix;
}
;
 //# sourceMappingURL=addMaskLocalBounds.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/alpha/AlphaMask.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlphaMask",
    ()=>AlphaMask
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$Sprite$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/Sprite.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$utils$2f$addMaskBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/utils/addMaskBounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$utils$2f$addMaskLocalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/utils/addMaskLocalBounds.mjs [app-client] (ecmascript)");
;
;
;
;
"use strict";
class AlphaMask {
    init(mask) {
        this.mask = mask;
        this.renderMaskToTexture = !(mask instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$Sprite$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sprite"]);
        this.mask.renderable = this.renderMaskToTexture;
        this.mask.includeInBuild = !this.renderMaskToTexture;
        this.mask.measurable = false;
    }
    reset() {
        this.mask.measurable = true;
        this.mask = null;
    }
    addBounds(bounds, skipUpdateTransform) {
        if (!this.inverse) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$utils$2f$addMaskBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addMaskBounds"])(this.mask, bounds, skipUpdateTransform);
        }
    }
    addLocalBounds(bounds, localRoot) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$utils$2f$addMaskLocalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addMaskLocalBounds"])(this.mask, bounds, localRoot);
    }
    containsPoint(point, hitTestFn) {
        const mask = this.mask;
        return hitTestFn(mask, point);
    }
    destroy() {
        this.reset();
    }
    static test(mask) {
        return mask instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$Sprite$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sprite"];
    }
    constructor(options){
        this.priority = 0;
        this.inverse = false;
        this.pipe = "alphaMask";
        if (options === null || options === void 0 ? void 0 : options.mask) {
            this.init(options.mask);
        }
    }
}
AlphaMask.extension = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].MaskEffect;
;
 //# sourceMappingURL=AlphaMask.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/color/ColorMask.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ColorMask",
    ()=>ColorMask
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
;
"use strict";
class ColorMask {
    init(mask) {
        this.mask = mask;
    }
    destroy() {}
    static test(mask) {
        return typeof mask === "number";
    }
    constructor(options){
        this.priority = 0;
        this.pipe = "colorMask";
        if (options === null || options === void 0 ? void 0 : options.mask) {
            this.init(options.mask);
        }
    }
}
ColorMask.extension = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].MaskEffect;
;
 //# sourceMappingURL=ColorMask.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/stencil/StencilMask.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StencilMask",
    ()=>StencilMask
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/Container.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$utils$2f$addMaskBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/utils/addMaskBounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$utils$2f$addMaskLocalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/utils/addMaskLocalBounds.mjs [app-client] (ecmascript)");
;
;
;
;
"use strict";
class StencilMask {
    init(mask) {
        this.mask = mask;
        this.mask.includeInBuild = false;
        this.mask.measurable = false;
    }
    reset() {
        this.mask.measurable = true;
        this.mask.includeInBuild = true;
        this.mask = null;
    }
    addBounds(bounds, skipUpdateTransform) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$utils$2f$addMaskBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addMaskBounds"])(this.mask, bounds, skipUpdateTransform);
    }
    addLocalBounds(bounds, localRoot) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$utils$2f$addMaskLocalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addMaskLocalBounds"])(this.mask, bounds, localRoot);
    }
    containsPoint(point, hitTestFn) {
        const mask = this.mask;
        return hitTestFn(mask, point);
    }
    destroy() {
        this.reset();
    }
    static test(mask) {
        return mask instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"];
    }
    constructor(options){
        this.priority = 0;
        this.pipe = "stencilMask";
        if (options === null || options === void 0 ? void 0 : options.mask) {
            this.init(options.mask);
        }
    }
}
StencilMask.extension = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].MaskEffect;
;
 //# sourceMappingURL=StencilMask.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/CanvasSource.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CanvasSource",
    ()=>CanvasSource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
class CanvasSource extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureSource"] {
    resizeCanvas() {
        if (this.autoDensity && "style" in this.resource) {
            this.resource.style.width = "".concat(this.width, "px");
            this.resource.style.height = "".concat(this.height, "px");
        }
        if (this.resource.width !== this.pixelWidth || this.resource.height !== this.pixelHeight) {
            this.resource.width = this.pixelWidth;
            this.resource.height = this.pixelHeight;
        }
    }
    resize() {
        let width = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : this.width, height = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.height, resolution = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : this._resolution;
        const didResize = super.resize(width, height, resolution);
        if (didResize) {
            this.resizeCanvas();
        }
        return didResize;
    }
    static test(resource) {
        return globalThis.HTMLCanvasElement && resource instanceof HTMLCanvasElement || globalThis.OffscreenCanvas && resource instanceof OffscreenCanvas;
    }
    /**
   * Returns the 2D rendering context for the canvas.
   * Caches the context after creating it.
   * @returns The 2D rendering context of the canvas.
   */ get context2D() {
        return this._context2D || (this._context2D = this.resource.getContext("2d"));
    }
    constructor(options){
        if (!options.resource) {
            options.resource = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas();
        }
        if (!options.width) {
            options.width = options.resource.width;
            if (!options.autoDensity) {
                options.width /= options.resolution;
            }
        }
        if (!options.height) {
            options.height = options.resource.height;
            if (!options.autoDensity) {
                options.height /= options.resolution;
            }
        }
        super(options);
        this.uploadMethodId = "image";
        this.autoDensity = options.autoDensity;
        this.resizeCanvas();
        this.transparent = !!options.transparent;
    }
}
CanvasSource.extension = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].TextureSource;
;
 //# sourceMappingURL=CanvasSource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/ImageSource.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ImageSource",
    ()=>ImageSource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-client] (ecmascript)");
;
;
"use strict";
class ImageSource extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureSource"] {
    static test(resource) {
        return globalThis.HTMLImageElement && resource instanceof HTMLImageElement || typeof ImageBitmap !== "undefined" && resource instanceof ImageBitmap || globalThis.VideoFrame && resource instanceof VideoFrame;
    }
    constructor(options){
        super(options);
        this.uploadMethodId = "image";
        this.autoGarbageCollect = true;
    }
}
ImageSource.extension = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].TextureSource;
;
 //# sourceMappingURL=ImageSource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/VideoSource.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VideoSource",
    ()=>VideoSource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/ticker/Ticker.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$detectVideoAlphaMode$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/detectVideoAlphaMode.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-client] (ecmascript)");
;
;
;
;
"use strict";
const _VideoSource = class _VideoSource extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureSource"] {
    /** Update the video frame if the source is not destroyed and meets certain conditions. */ updateFrame() {
        if (this.destroyed) {
            return;
        }
        if (this._updateFPS) {
            const elapsedMS = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Ticker"].shared.elapsedMS * this.resource.playbackRate;
            this._msToNextUpdate = Math.floor(this._msToNextUpdate - elapsedMS);
        }
        if (!this._updateFPS || this._msToNextUpdate <= 0) {
            this._msToNextUpdate = this._updateFPS ? Math.floor(1e3 / this._updateFPS) : 0;
        }
        if (this.isValid) {
            this.update();
        }
    }
    /** Callback to update the video frame and potentially request the next frame update. */ _videoFrameRequestCallback() {
        this.updateFrame();
        if (this.destroyed) {
            this._videoFrameRequestCallbackHandle = null;
        } else {
            this._videoFrameRequestCallbackHandle = this.resource.requestVideoFrameCallback(this._videoFrameRequestCallback);
        }
    }
    /**
   * Checks if the resource has valid dimensions.
   * @returns {boolean} True if width and height are set, otherwise false.
   */ get isValid() {
        return !!this.resource.videoWidth && !!this.resource.videoHeight;
    }
    /**
   * Start preloading the video resource.
   * @returns {Promise<this>} Handle the validate event
   */ async load() {
        if (this._load) {
            return this._load;
        }
        const source = this.resource;
        const options = this.options;
        if ((source.readyState === source.HAVE_ENOUGH_DATA || source.readyState === source.HAVE_FUTURE_DATA) && source.width && source.height) {
            source.complete = true;
        }
        source.addEventListener("play", this._onPlayStart);
        source.addEventListener("pause", this._onPlayStop);
        source.addEventListener("seeked", this._onSeeked);
        if (!this._isSourceReady()) {
            if (!options.preload) {
                source.addEventListener("canplay", this._onCanPlay);
            }
            source.addEventListener("canplaythrough", this._onCanPlayThrough);
            source.addEventListener("error", this._onError, true);
        } else {
            this._mediaReady();
        }
        this.alphaMode = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$detectVideoAlphaMode$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["detectVideoAlphaMode"])();
        this._load = new Promise((resolve, reject)=>{
            if (this.isValid) {
                resolve(this);
            } else {
                this._resolve = resolve;
                this._reject = reject;
                if (options.preloadTimeoutMs !== void 0) {
                    this._preloadTimeout = setTimeout(()=>{
                        this._onError(new ErrorEvent("Preload exceeded timeout of ".concat(options.preloadTimeoutMs, "ms")));
                    });
                }
                source.load();
            }
        });
        return this._load;
    }
    /**
   * Handle video error events.
   * @param event - The error event
   */ _onError(event) {
        this.resource.removeEventListener("error", this._onError, true);
        this.emit("error", event);
        if (this._reject) {
            this._reject(event);
            this._reject = null;
            this._resolve = null;
        }
    }
    /**
   * Checks if the underlying source is playing.
   * @returns True if playing.
   */ _isSourcePlaying() {
        const source = this.resource;
        return !source.paused && !source.ended;
    }
    /**
   * Checks if the underlying source is ready for playing.
   * @returns True if ready.
   */ _isSourceReady() {
        const source = this.resource;
        return source.readyState > 2;
    }
    /** Runs the update loop when the video is ready to play. */ _onPlayStart() {
        if (!this.isValid) {
            this._mediaReady();
        }
        this._configureAutoUpdate();
    }
    /** Stops the update loop when a pause event is triggered. */ _onPlayStop() {
        this._configureAutoUpdate();
    }
    /** Handles behavior when the video completes seeking to the current playback position. */ _onSeeked() {
        if (this._autoUpdate && !this._isSourcePlaying()) {
            this._msToNextUpdate = 0;
            this.updateFrame();
            this._msToNextUpdate = 0;
        }
    }
    _onCanPlay() {
        const source = this.resource;
        source.removeEventListener("canplay", this._onCanPlay);
        this._mediaReady();
    }
    _onCanPlayThrough() {
        const source = this.resource;
        source.removeEventListener("canplaythrough", this._onCanPlay);
        if (this._preloadTimeout) {
            clearTimeout(this._preloadTimeout);
            this._preloadTimeout = void 0;
        }
        this._mediaReady();
    }
    /** Fired when the video is loaded and ready to play. */ _mediaReady() {
        const source = this.resource;
        if (this.isValid) {
            this.isReady = true;
            this.resize(source.videoWidth, source.videoHeight);
        }
        this._msToNextUpdate = 0;
        this.updateFrame();
        this._msToNextUpdate = 0;
        if (this._resolve) {
            this._resolve(this);
            this._resolve = null;
            this._reject = null;
        }
        if (this._isSourcePlaying()) {
            this._onPlayStart();
        } else if (this.autoPlay) {
            void this.resource.play();
        }
    }
    /** Cleans up resources and event listeners associated with this texture. */ destroy() {
        this._configureAutoUpdate();
        const source = this.resource;
        if (source) {
            source.removeEventListener("play", this._onPlayStart);
            source.removeEventListener("pause", this._onPlayStop);
            source.removeEventListener("seeked", this._onSeeked);
            source.removeEventListener("canplay", this._onCanPlay);
            source.removeEventListener("canplaythrough", this._onCanPlayThrough);
            source.removeEventListener("error", this._onError, true);
            source.pause();
            source.src = "";
            source.load();
        }
        super.destroy();
    }
    /** Should the base texture automatically update itself, set to true by default. */ get autoUpdate() {
        return this._autoUpdate;
    }
    set autoUpdate(value) {
        if (value !== this._autoUpdate) {
            this._autoUpdate = value;
            this._configureAutoUpdate();
        }
    }
    /**
   * How many times a second to update the texture from the video.
   * Leave at 0 to update at every render.
   * A lower fps can help performance, as updating the texture at 60fps on a 30ps video may not be efficient.
   */ get updateFPS() {
        return this._updateFPS;
    }
    set updateFPS(value) {
        if (value !== this._updateFPS) {
            this._updateFPS = value;
            this._configureAutoUpdate();
        }
    }
    /**
   * Configures the updating mechanism based on the current state and settings.
   *
   * This method decides between using the browser's native video frame callback or a custom ticker
   * for updating the video frame. It ensures optimal performance and responsiveness
   * based on the video's state, playback status, and the desired frames-per-second setting.
   *
   * - If `_autoUpdate` is enabled and the video source is playing:
   *   - It will prefer the native video frame callback if available and no specific FPS is set.
   *   - Otherwise, it will use a custom ticker for manual updates.
   * - If `_autoUpdate` is disabled or the video isn't playing, any active update mechanisms are halted.
   */ _configureAutoUpdate() {
        if (this._autoUpdate && this._isSourcePlaying()) {
            if (!this._updateFPS && this.resource.requestVideoFrameCallback) {
                if (this._isConnectedToTicker) {
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Ticker"].shared.remove(this.updateFrame, this);
                    this._isConnectedToTicker = false;
                    this._msToNextUpdate = 0;
                }
                if (this._videoFrameRequestCallbackHandle === null) {
                    this._videoFrameRequestCallbackHandle = this.resource.requestVideoFrameCallback(this._videoFrameRequestCallback);
                }
            } else {
                if (this._videoFrameRequestCallbackHandle !== null) {
                    this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle);
                    this._videoFrameRequestCallbackHandle = null;
                }
                if (!this._isConnectedToTicker) {
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Ticker"].shared.add(this.updateFrame, this);
                    this._isConnectedToTicker = true;
                    this._msToNextUpdate = 0;
                }
            }
        } else {
            if (this._videoFrameRequestCallbackHandle !== null) {
                this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle);
                this._videoFrameRequestCallbackHandle = null;
            }
            if (this._isConnectedToTicker) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Ticker"].shared.remove(this.updateFrame, this);
                this._isConnectedToTicker = false;
                this._msToNextUpdate = 0;
            }
        }
    }
    static test(resource) {
        return globalThis.HTMLVideoElement && resource instanceof HTMLVideoElement;
    }
    constructor(options){
        super(options);
        // Public
        /** Whether or not the video is ready to play. */ this.isReady = false;
        /** The upload method for this texture. */ this.uploadMethodId = "video";
        options = {
            ..._VideoSource.defaultOptions,
            ...options
        };
        this._autoUpdate = true;
        this._isConnectedToTicker = false;
        this._updateFPS = options.updateFPS || 0;
        this._msToNextUpdate = 0;
        this.autoPlay = options.autoPlay !== false;
        var _options_alphaMode;
        this.alphaMode = (_options_alphaMode = options.alphaMode) !== null && _options_alphaMode !== void 0 ? _options_alphaMode : "premultiply-alpha-on-upload";
        this._videoFrameRequestCallback = this._videoFrameRequestCallback.bind(this);
        this._videoFrameRequestCallbackHandle = null;
        this._load = null;
        this._resolve = null;
        this._reject = null;
        this._onCanPlay = this._onCanPlay.bind(this);
        this._onCanPlayThrough = this._onCanPlayThrough.bind(this);
        this._onError = this._onError.bind(this);
        this._onPlayStart = this._onPlayStart.bind(this);
        this._onPlayStop = this._onPlayStop.bind(this);
        this._onSeeked = this._onSeeked.bind(this);
        if (options.autoLoad !== false) {
            void this.load();
        }
    }
};
_VideoSource.extension = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].TextureSource;
/** The default options for video sources. */ _VideoSource.defaultOptions = {
    ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureSource"].defaultOptions,
    /** If true, the video will start loading immediately. */ autoLoad: true,
    /** If true, the video will start playing as soon as it is loaded. */ autoPlay: true,
    /** The number of times a second to update the texture from the video. Leave at 0 to update at every render. */ updateFPS: 0,
    /** If true, the video will be loaded with the `crossorigin` attribute. */ crossorigin: true,
    /** If true, the video will loop when it ends. */ loop: false,
    /** If true, the video will be muted. */ muted: true,
    /** If true, the video will play inline. */ playsinline: true,
    /** If true, the video will be preloaded. */ preload: false
};
/**
 * Map of video MIME types that can't be directly derived from file extensions.
 * @readonly
 */ _VideoSource.MIME_TYPES = {
    ogv: "video/ogg",
    mov: "video/quicktime",
    m4v: "video/mp4"
};
let VideoSource = _VideoSource;
;
 //# sourceMappingURL=VideoSource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/textureFrom.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "autoDetectSource",
    ()=>autoDetectSource,
    "resourceToTexture",
    ()=>resourceToTexture,
    "textureFrom",
    ()=>textureFrom
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/cache/Cache.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
;
;
;
;
"use strict";
const sources = [];
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].handleByList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].TextureSource, sources);
function autoDetectSource() {
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return textureSourceFrom(options);
}
function textureSourceFrom() {
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const hasResource = options && options.resource;
    const res = hasResource ? options.resource : options;
    const opts = hasResource ? options : {
        resource: options
    };
    for(let i = 0; i < sources.length; i++){
        const Source = sources[i];
        if (Source.test(res)) {
            return new Source(opts);
        }
    }
    throw new Error("Could not find a source type for resource: ".concat(opts.resource));
}
function resourceToTexture() {
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, skipCache = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    const hasResource = options && options.resource;
    const resource = hasResource ? options.resource : options;
    const opts = hasResource ? options : {
        resource: options
    };
    if (!skipCache && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].has(resource)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].get(resource);
    }
    const texture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]({
        source: textureSourceFrom(opts)
    });
    texture.on("destroy", ()=>{
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].has(resource)) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].remove(resource);
        }
    });
    if (!skipCache) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].set(resource, texture);
    }
    return texture;
}
function textureFrom(id) {
    let skipCache = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    if (typeof id === "string") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].get(id);
    } else if (id instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureSource"]) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]({
            source: id
        });
    }
    return resourceToTexture(id, skipCache);
}
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].from = textureFrom;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureSource"].from = textureSourceFrom;
;
 //# sourceMappingURL=textureFrom.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/init.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$alpha$2f$AlphaMask$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/alpha/AlphaMask.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$color$2f$ColorMask$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/color/ColorMask.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$stencil$2f$StencilMask$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/stencil/StencilMask.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$BufferImageSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/BufferImageSource.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/CanvasSource.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$ImageSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/ImageSource.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$VideoSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/VideoSource.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$utils$2f$textureFrom$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/textureFrom.mjs [app-client] (ecmascript)");
;
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
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$alpha$2f$AlphaMask$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaMask"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$color$2f$ColorMask$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ColorMask"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$stencil$2f$StencilMask$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StencilMask"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$VideoSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VideoSource"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$ImageSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ImageSource"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CanvasSource"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$BufferImageSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferImageSource"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/const.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CLEAR",
    ()=>CLEAR
]);
"use strict";
var CLEAR = /* @__PURE__ */ ((CLEAR2)=>{
    CLEAR2[CLEAR2["NONE"] = 0] = "NONE";
    CLEAR2[CLEAR2["COLOR"] = 16384] = "COLOR";
    CLEAR2[CLEAR2["STENCIL"] = 1024] = "STENCIL";
    CLEAR2[CLEAR2["DEPTH"] = 256] = "DEPTH";
    CLEAR2[CLEAR2["COLOR_DEPTH"] = 16640] = "COLOR_DEPTH";
    CLEAR2[CLEAR2["COLOR_STENCIL"] = 17408] = "COLOR_STENCIL";
    CLEAR2[CLEAR2["DEPTH_STENCIL"] = 1280] = "DEPTH_STENCIL";
    CLEAR2[CLEAR2["ALL"] = 17664] = "ALL";
    return CLEAR2;
})(CLEAR || {});
;
 //# sourceMappingURL=const.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/SystemRunner.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SystemRunner",
    ()=>SystemRunner
]);
"use strict";
class SystemRunner {
    /* jsdoc/check-param-names */ /**
   * Dispatch/Broadcast Runner to all listeners added to the queue.
   * @param {...any} params - (optional) parameters to pass to each listener
   */ /* jsdoc/check-param-names */ emit(a0, a1, a2, a3, a4, a5, a6, a7) {
        const { name, items } = this;
        for(let i = 0, len = items.length; i < len; i++){
            items[i][name](a0, a1, a2, a3, a4, a5, a6, a7);
        }
        return this;
    }
    /**
   * Add a listener to the Runner
   *
   * Runners do not need to have scope or functions passed to them.
   * All that is required is to pass the listening object and ensure that it has contains a function that has the same name
   * as the name provided to the Runner when it was created.
   *
   * Eg A listener passed to this Runner will require a 'complete' function.
   *
   * ```ts
   * import { Runner } from 'pixi.js';
   *
   * const complete = new Runner('complete');
   * ```
   *
   * The scope used will be the object itself.
   * @param {any} item - The object that will be listening.
   */ add(item) {
        if (item[this._name]) {
            this.remove(item);
            this.items.push(item);
        }
        return this;
    }
    /**
   * Remove a single listener from the dispatch queue.
   * @param {any} item - The listener that you would like to remove.
   */ remove(item) {
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
        return this;
    }
    /**
   * Check to see if the listener is already in the Runner
   * @param {any} item - The listener that you would like to check.
   */ contains(item) {
        return this.items.indexOf(item) !== -1;
    }
    /** Remove all listeners from the Runner */ removeAll() {
        this.items.length = 0;
        return this;
    }
    /** Remove all references, don't use after this. */ destroy() {
        this.removeAll();
        this.items = null;
        this._name = null;
    }
    /**
   * `true` if there are no this Runner contains no listeners
   * @readonly
   */ get empty() {
        return this.items.length === 0;
    }
    /**
   * The name of the runner.
   * @readonly
   */ get name() {
        return this._name;
    }
    /**
   * @param name - The function name that will be executed on the listeners added to this Runner.
   */ constructor(name){
        this.items = [];
        this._name = name;
    }
}
;
 //# sourceMappingURL=SystemRunner.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/AbstractRenderer.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AbstractRenderer",
    ()=>AbstractRenderer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$autoDetectEnvironment$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/autoDetectEnvironment.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/Container.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$unsafeEvalSupported$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/unsafeEvalSupported.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/GlobalResourceRegistry.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/const.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SystemRunner$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/SystemRunner.mjs [app-client] (ecmascript)");
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
"use strict";
const defaultRunners = [
    "init",
    "destroy",
    "contextChange",
    "resolutionChange",
    "resetState",
    "renderEnd",
    "renderStart",
    "render",
    "update",
    "postrender",
    "prerender"
];
const _AbstractRenderer = class _AbstractRenderer extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    /**
   * Initialize the renderer.
   * @param options - The options to use to create the renderer.
   */ async init() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        const skip = options.skipExtensionImports === true ? true : options.manageImports === false;
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$autoDetectEnvironment$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["loadEnvironmentExtensions"])(skip);
        this._addSystems(this.config.systems);
        this._addPipes(this.config.renderPipes, this.config.renderPipeAdaptors);
        for(const systemName in this._systemsHash){
            const system = this._systemsHash[systemName];
            const defaultSystemOptions = system.constructor.defaultOptions;
            options = {
                ...defaultSystemOptions,
                ...options
            };
        }
        options = {
            ..._AbstractRenderer.defaultOptions,
            ...options
        };
        this._roundPixels = options.roundPixels ? 1 : 0;
        for(let i = 0; i < this.runners.init.items.length; i++){
            await this.runners.init.items[i].init(options);
        }
        this._initOptions = options;
    }
    render(args, deprecated) {
        let options = args;
        if (options instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"]) {
            options = {
                container: options
            };
            if (deprecated) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "passing a second argument is deprecated, please use render options instead");
                options.target = deprecated.renderTexture;
            }
        }
        options.target || (options.target = this.view.renderTarget);
        if (options.target === this.view.renderTarget) {
            this._lastObjectRendered = options.container;
            var _options_clearColor;
            (_options_clearColor = options.clearColor) !== null && _options_clearColor !== void 0 ? _options_clearColor : options.clearColor = this.background.colorRgba;
            var _options_clear;
            (_options_clear = options.clear) !== null && _options_clear !== void 0 ? _options_clear : options.clear = this.background.clearBeforeRender;
        }
        if (options.clearColor) {
            const isRGBAArray = Array.isArray(options.clearColor) && options.clearColor.length === 4;
            options.clearColor = isRGBAArray ? options.clearColor : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(options.clearColor).toArray();
        }
        if (!options.transform) {
            options.container.updateLocalTransform();
            options.transform = options.container.localTransform;
        }
        if (!options.container.visible) {
            return;
        }
        options.container.enableRenderGroup();
        this.runners.prerender.emit(options);
        this.runners.renderStart.emit(options);
        this.runners.render.emit(options);
        this.runners.renderEnd.emit(options);
        this.runners.postrender.emit(options);
    }
    /**
   * Resizes the WebGL view to the specified width and height.
   * @param desiredScreenWidth - The desired width of the screen.
   * @param desiredScreenHeight - The desired height of the screen.
   * @param resolution - The resolution / device pixel ratio of the renderer.
   */ resize(desiredScreenWidth, desiredScreenHeight, resolution) {
        const previousResolution = this.view.resolution;
        this.view.resize(desiredScreenWidth, desiredScreenHeight, resolution);
        this.emit("resize", this.view.screen.width, this.view.screen.height, this.view.resolution);
        if (resolution !== void 0 && resolution !== previousResolution) {
            this.runners.resolutionChange.emit(resolution);
        }
    }
    /**
   * Clears the render target.
   * @param options - The options to use when clearing the render target.
   * @param options.target - The render target to clear.
   * @param options.clearColor - The color to clear with.
   * @param options.clear - The clear mode to use.
   * @advanced
   */ clear() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        const renderer = this;
        options.target || (options.target = renderer.renderTarget.renderTarget);
        options.clearColor || (options.clearColor = this.background.colorRgba);
        var _options_clear;
        (_options_clear = options.clear) !== null && _options_clear !== void 0 ? _options_clear : options.clear = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CLEAR"].ALL;
        const { clear, clearColor, target } = options;
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(clearColor !== null && clearColor !== void 0 ? clearColor : this.background.colorRgba);
        renderer.renderTarget.clear(target, clear, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.toArray());
    }
    /** The resolution / device pixel ratio of the renderer. */ get resolution() {
        return this.view.resolution;
    }
    set resolution(value) {
        this.view.resolution = value;
        this.runners.resolutionChange.emit(value);
    }
    /**
   * Same as view.width, actual number of pixels in the canvas by horizontal.
   * @type {number}
   * @readonly
   * @default 800
   */ get width() {
        return this.view.texture.frame.width;
    }
    /**
   * Same as view.height, actual number of pixels in the canvas by vertical.
   * @default 600
   */ get height() {
        return this.view.texture.frame.height;
    }
    // NOTE: this was `view` in v7
    /**
   * The canvas element that everything is drawn to.
   * @type {environment.ICanvas}
   */ get canvas() {
        return this.view.canvas;
    }
    /**
   * the last object rendered by the renderer. Useful for other plugins like interaction managers
   * @readonly
   */ get lastObjectRendered() {
        return this._lastObjectRendered;
    }
    /**
   * Flag if we are rendering to the screen vs renderTexture
   * @readonly
   * @default true
   */ get renderingToScreen() {
        const renderer = this;
        return renderer.renderTarget.renderingToScreen;
    }
    /**
   * Measurements of the screen. (0, 0, screenWidth, screenHeight).
   *
   * Its safe to use as filterArea or hitArea for the whole stage.
   */ get screen() {
        return this.view.screen;
    }
    /**
   * Create a bunch of runners based of a collection of ids
   * @param runnerIds - the runner ids to add
   */ _addRunners() {
        for(var _len = arguments.length, runnerIds = new Array(_len), _key = 0; _key < _len; _key++){
            runnerIds[_key] = arguments[_key];
        }
        runnerIds.forEach((runnerId)=>{
            this.runners[runnerId] = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SystemRunner$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SystemRunner"](runnerId);
        });
    }
    _addSystems(systems) {
        let i;
        for(i in systems){
            const val = systems[i];
            this._addSystem(val.value, val.name);
        }
    }
    /**
   * Add a new system to the renderer.
   * @param ClassRef - Class reference
   * @param name - Property name for system, if not specified
   *        will use a static `name` property on the class itself. This
   *        name will be assigned as s property on the Renderer so make
   *        sure it doesn't collide with properties on Renderer.
   * @returns Return instance of renderer
   */ _addSystem(ClassRef, name) {
        const system = new ClassRef(this);
        if (this[name]) {
            throw new Error('Whoops! The name "'.concat(name, '" is already in use'));
        }
        this[name] = system;
        this._systemsHash[name] = system;
        for(const i in this.runners){
            this.runners[i].add(system);
        }
        return this;
    }
    _addPipes(pipes, pipeAdaptors) {
        const adaptors = pipeAdaptors.reduce((acc, adaptor)=>{
            acc[adaptor.name] = adaptor.value;
            return acc;
        }, {});
        pipes.forEach((pipe)=>{
            const PipeClass = pipe.value;
            const name = pipe.name;
            const Adaptor = adaptors[name];
            this.renderPipes[name] = new PipeClass(this, Adaptor ? new Adaptor() : null);
            this.runners.destroy.add(this.renderPipes[name]);
        });
    }
    destroy() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        this.runners.destroy.items.reverse();
        this.runners.destroy.emit(options);
        Object.values(this.runners).forEach((runner)=>{
            runner.destroy();
        });
        if (options === true || typeof options === "object" && options.releaseGlobalResources) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GlobalResourceRegistry"].release();
        }
        this._systemsHash = null;
        this.renderPipes = null;
    }
    /**
   * Generate a texture from a container.
   * @param options - options or container target to use when generating the texture
   * @returns a texture
   */ generateTexture(options) {
        return this.textureGenerator.generateTexture(options);
    }
    /**
   * Whether the renderer will round coordinates to whole pixels when rendering.
   * Can be overridden on a per scene item basis.
   */ get roundPixels() {
        return !!this._roundPixels;
    }
    /**
   * Overridable function by `pixi.js/unsafe-eval` to silence
   * throwing an error if platform doesn't support unsafe-evals.
   * @private
   * @ignore
   */ _unsafeEvalCheck() {
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$unsafeEvalSupported$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["unsafeEvalSupported"])()) {
            throw new Error("Current environment does not allow unsafe-eval, please use pixi.js/unsafe-eval module to enable support.");
        }
    }
    /**
   * Resets the rendering state of the renderer.
   * This is useful when you want to use the WebGL context directly and need to ensure PixiJS's internal state
   * stays synchronized. When modifying the WebGL context state externally, calling this method before the next Pixi
   * render will reset all internal caches and ensure it executes correctly.
   *
   * This is particularly useful when combining PixiJS with other rendering engines like Three.js:
   * ```js
   * // Reset Three.js state
   * threeRenderer.resetState();
   *
   * // Render a Three.js scene
   * threeRenderer.render(threeScene, threeCamera);
   *
   * // Reset PixiJS state since Three.js modified the WebGL context
   * pixiRenderer.resetState();
   *
   * // Now render Pixi content
   * pixiRenderer.render(pixiScene);
   * ```
   * @advanced
   */ resetState() {
        this.runners.resetState.emit();
    }
    /**
   * Set up a system with a collection of SystemClasses and runners.
   * Systems are attached dynamically to this class when added.
   * @param config - the config for the system manager
   */ constructor(config){
        super();
        /** @internal */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("renderer");
        /** @internal */ this.runners = /* @__PURE__ */ Object.create(null);
        /** @internal */ this.renderPipes = /* @__PURE__ */ Object.create(null);
        this._initOptions = {};
        this._systemsHash = /* @__PURE__ */ Object.create(null);
        this.type = config.type;
        this.name = config.name;
        this.config = config;
        var _this_config_runners;
        const combinedRunners = [
            ...defaultRunners,
            ...(_this_config_runners = this.config.runners) !== null && _this_config_runners !== void 0 ? _this_config_runners : []
        ];
        this._addRunners(...combinedRunners);
        this._unsafeEvalCheck();
    }
};
/** The default options for the renderer. */ _AbstractRenderer.defaultOptions = {
    /**
   * Default resolution / device pixel ratio of the renderer.
   * @default 1
   */ resolution: 1,
    /**
   * Should the `failIfMajorPerformanceCaveat` flag be enabled as a context option used in the `isWebGLSupported`
   * function. If set to true, a WebGL renderer can fail to be created if the browser thinks there could be
   * performance issues when using WebGL.
   *
   * In PixiJS v6 this has changed from true to false by default, to allow WebGL to work in as many
   * scenarios as possible. However, some users may have a poor experience, for example, if a user has a gpu or
   * driver version blacklisted by the
   * browser.
   *
   * If your application requires high performance rendering, you may wish to set this to false.
   * We recommend one of two options if you decide to set this flag to false:
   *
   * 1: Use the Canvas renderer as a fallback in case high performance WebGL is
   *    not supported.
   *
   * 2: Call `isWebGLSupported` (which if found in the utils package) in your code before attempting to create a
   *    PixiJS renderer, and show an error message to the user if the function returns false, explaining that their
   *    device & browser combination does not support high performance WebGL.
   *    This is a much better strategy than trying to create a PixiJS renderer and finding it then fails.
   * @default false
   */ failIfMajorPerformanceCaveat: false,
    /**
   * Should round pixels be forced when rendering?
   * @default false
   */ roundPixels: false
};
let AbstractRenderer = _AbstractRenderer;
;
 //# sourceMappingURL=AbstractRenderer.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/autoDetectRenderer.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "autoDetectRenderer",
    ()=>autoDetectRenderer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$isWebGLSupported$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/isWebGLSupported.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$isWebGPUSupported$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/isWebGPUSupported.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$AbstractRenderer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/AbstractRenderer.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
const renderPriority = [
    "webgl",
    "webgpu",
    "canvas"
];
async function autoDetectRenderer(options) {
    let preferredOrder = [];
    if (options.preference) {
        preferredOrder.push(options.preference);
        renderPriority.forEach((item)=>{
            if (item !== options.preference) {
                preferredOrder.push(item);
            }
        });
    } else {
        preferredOrder = renderPriority.slice();
    }
    let RendererClass;
    let finalOptions = {};
    for(let i = 0; i < preferredOrder.length; i++){
        const rendererType = preferredOrder[i];
        var _options_failIfMajorPerformanceCaveat;
        if (rendererType === "webgpu" && await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$isWebGPUSupported$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWebGPUSupported"])()) {
            const { WebGPURenderer } = await __turbopack_context__.A("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/WebGPURenderer.mjs [app-client] (ecmascript, async loader)");
            RendererClass = WebGPURenderer;
            finalOptions = {
                ...options,
                ...options.webgpu
            };
            break;
        } else if (rendererType === "webgl" && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$isWebGLSupported$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWebGLSupported"])((_options_failIfMajorPerformanceCaveat = options.failIfMajorPerformanceCaveat) !== null && _options_failIfMajorPerformanceCaveat !== void 0 ? _options_failIfMajorPerformanceCaveat : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$AbstractRenderer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AbstractRenderer"].defaultOptions.failIfMajorPerformanceCaveat)) {
            const { WebGLRenderer } = await __turbopack_context__.A("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/WebGLRenderer.mjs [app-client] (ecmascript, async loader)");
            RendererClass = WebGLRenderer;
            finalOptions = {
                ...options,
                ...options.webgl
            };
            break;
        } else if (rendererType === "canvas") {
            finalOptions = {
                ...options
            };
            throw new Error("CanvasRenderer is not yet implemented");
        }
    }
    delete finalOptions.webgpu;
    delete finalOptions.webgl;
    if (!RendererClass) {
        throw new Error("No available renderer for the current environment");
    }
    const renderer = new RendererClass();
    await renderer.init(finalOptions);
    return renderer;
}
;
 //# sourceMappingURL=autoDetectRenderer.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/BindGroup.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BindGroup",
    ()=>BindGroup
]);
"use strict";
class BindGroup {
    /**
   * Updates the key if its flagged as dirty. This is used internally to
   * match this bind group to a WebGPU BindGroup.
   * @internal
   */ _updateKey() {
        if (!this._dirty) return;
        this._dirty = false;
        const keyParts = [];
        let index = 0;
        for(const i in this.resources){
            keyParts[index++] = this.resources[i]._resourceId;
        }
        this._key = keyParts.join("|");
    }
    /**
   * Set a resource at a given index. this function will
   * ensure that listeners will be removed from the current resource
   * and added to the new resource.
   * @param resource - The resource to set.
   * @param index - The index to set the resource at.
   */ setResource(resource, index) {
        var _resource_on;
        const currentResource = this.resources[index];
        if (resource === currentResource) return;
        if (currentResource) {
            var _resource_off;
            (_resource_off = resource.off) === null || _resource_off === void 0 ? void 0 : _resource_off.call(resource, "change", this.onResourceChange, this);
        }
        (_resource_on = resource.on) === null || _resource_on === void 0 ? void 0 : _resource_on.call(resource, "change", this.onResourceChange, this);
        this.resources[index] = resource;
        this._dirty = true;
    }
    /**
   * Returns the resource at the current specified index.
   * @param index - The index of the resource to get.
   * @returns - The resource at the specified index.
   */ getResource(index) {
        return this.resources[index];
    }
    /**
   * Used internally to 'touch' each resource, to ensure that the GC
   * knows that all resources in this bind group are still being used.
   * @param tick - The current tick.
   * @internal
   */ _touch(tick) {
        const resources = this.resources;
        for(const i in resources){
            resources[i]._touched = tick;
        }
    }
    /** Destroys this bind group and removes all listeners. */ destroy() {
        const resources = this.resources;
        for(const i in resources){
            var _resource_off;
            const resource = resources[i];
            (_resource_off = resource.off) === null || _resource_off === void 0 ? void 0 : _resource_off.call(resource, "change", this.onResourceChange, this);
        }
        this.resources = null;
    }
    onResourceChange(resource) {
        this._dirty = true;
        if (resource.destroyed) {
            const resources = this.resources;
            for(const i in resources){
                if (resources[i] === resource) {
                    resources[i] = null;
                }
            }
        } else {
            this._updateKey();
        }
    }
    /**
   * Create a new instance eof the Bind Group.
   * @param resources - The resources that are bound together for use by a shader.
   */ constructor(resources){
        /** The resources that are bound together for use by a shader. */ this.resources = /* @__PURE__ */ Object.create(null);
        this._dirty = true;
        let index = 0;
        for(const i in resources){
            const resource = resources[i];
            this.setResource(resource, index++);
        }
        this._updateKey();
    }
}
;
 //# sourceMappingURL=BindGroup.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gpu/getTextureBatchBindGroup.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTextureBatchBindGroup",
    ()=>getTextureBatchBindGroup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/BindGroup.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
;
;
"use strict";
const cachedGroups = {};
function getTextureBatchBindGroup(textures, size, maxTextures) {
    let uid = 2166136261;
    for(let i = 0; i < size; i++){
        uid ^= textures[i].uid;
        uid = Math.imul(uid, 16777619);
        uid >>>= 0;
    }
    return cachedGroups[uid] || generateTextureBatchBindGroup(textures, size, uid, maxTextures);
}
function generateTextureBatchBindGroup(textures, size, key, maxTextures) {
    const bindGroupResources = {};
    let bindIndex = 0;
    for(let i = 0; i < maxTextures; i++){
        const texture = i < size ? textures[i] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].EMPTY.source;
        bindGroupResources[bindIndex++] = texture.source;
        bindGroupResources[bindIndex++] = texture.style;
    }
    const bindGroup = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BindGroup"](bindGroupResources);
    cachedGroups[key] = bindGroup;
    return bindGroup;
}
;
 //# sourceMappingURL=getTextureBatchBindGroup.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/utils/fastCopy.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fastCopy",
    ()=>fastCopy
]);
"use strict";
function fastCopy(sourceBuffer, destinationBuffer) {
    const lengthDouble = sourceBuffer.byteLength / 8 | 0;
    const sourceFloat64View = new Float64Array(sourceBuffer, 0, lengthDouble);
    const destinationFloat64View = new Float64Array(destinationBuffer, 0, lengthDouble);
    destinationFloat64View.set(sourceFloat64View);
    const remainingBytes = sourceBuffer.byteLength - lengthDouble * 8;
    if (remainingBytes > 0) {
        const sourceUint8View = new Uint8Array(sourceBuffer, lengthDouble * 8, remainingBytes);
        const destinationUint8View = new Uint8Array(destinationBuffer, lengthDouble * 8, remainingBytes);
        destinationUint8View.set(sourceUint8View);
    }
}
;
 //# sourceMappingURL=fastCopy.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/const.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BLEND_TO_NPM",
    ()=>BLEND_TO_NPM,
    "STENCIL_MODES",
    ()=>STENCIL_MODES
]);
"use strict";
const BLEND_TO_NPM = {
    normal: "normal-npm",
    add: "add-npm",
    screen: "screen-npm"
};
var STENCIL_MODES = /* @__PURE__ */ ((STENCIL_MODES2)=>{
    STENCIL_MODES2[STENCIL_MODES2["DISABLED"] = 0] = "DISABLED";
    STENCIL_MODES2[STENCIL_MODES2["RENDERING_MASK_ADD"] = 1] = "RENDERING_MASK_ADD";
    STENCIL_MODES2[STENCIL_MODES2["MASK_ACTIVE"] = 2] = "MASK_ACTIVE";
    STENCIL_MODES2[STENCIL_MODES2["INVERSE_MASK_ACTIVE"] = 3] = "INVERSE_MASK_ACTIVE";
    STENCIL_MODES2[STENCIL_MODES2["RENDERING_MASK_REMOVE"] = 4] = "RENDERING_MASK_REMOVE";
    STENCIL_MODES2[STENCIL_MODES2["NONE"] = 5] = "NONE";
    return STENCIL_MODES2;
})(STENCIL_MODES || {});
;
 //# sourceMappingURL=const.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/getAdjustedBlendModeBlend.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAdjustedBlendModeBlend",
    ()=>getAdjustedBlendModeBlend
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/const.mjs [app-client] (ecmascript)");
;
"use strict";
function getAdjustedBlendModeBlend(blendMode, textureSource) {
    if (textureSource.alphaMode === "no-premultiply-alpha") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BLEND_TO_NPM"][blendMode] || blendMode;
    }
    return blendMode;
}
;
 //# sourceMappingURL=getAdjustedBlendModeBlend.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getTestContext.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTestContext",
    ()=>getTestContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)");
;
"use strict";
let context;
function getTestContext() {
    if (!context || (context === null || context === void 0 ? void 0 : context.isContextLost())) {
        const canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas();
        context = canvas.getContext("webgl", {});
    }
    return context;
}
;
 //# sourceMappingURL=getTestContext.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gl/utils/checkMaxIfStatementsInShader.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkMaxIfStatementsInShader",
    ()=>checkMaxIfStatementsInShader
]);
"use strict";
const fragTemplate = [
    "precision mediump float;",
    "void main(void){",
    "float test = 0.1;",
    "%forloop%",
    "gl_FragColor = vec4(0.0);",
    "}"
].join("\n");
function generateIfTestSrc(maxIfs) {
    let src = "";
    for(let i = 0; i < maxIfs; ++i){
        if (i > 0) {
            src += "\nelse ";
        }
        if (i < maxIfs - 1) {
            src += "if(test == ".concat(i, ".0){}");
        }
    }
    return src;
}
function checkMaxIfStatementsInShader(maxIfs, gl) {
    if (maxIfs === 0) {
        throw new Error("Invalid value of `0` passed to `checkMaxIfStatementsInShader`");
    }
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    try {
        while(true){
            const fragmentSrc = fragTemplate.replace(/%forloop%/gi, generateIfTestSrc(maxIfs));
            gl.shaderSource(shader, fragmentSrc);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                maxIfs = maxIfs / 2 | 0;
            } else {
                break;
            }
        }
    } finally{
        gl.deleteShader(shader);
    }
    return maxIfs;
}
;
 //# sourceMappingURL=checkMaxIfStatementsInShader.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gl/utils/maxRecommendedTextures.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMaxTexturesPerBatch",
    ()=>getMaxTexturesPerBatch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$getTestContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getTestContext.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gl$2f$utils$2f$checkMaxIfStatementsInShader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gl/utils/checkMaxIfStatementsInShader.mjs [app-client] (ecmascript)");
;
;
"use strict";
let maxTexturesPerBatchCache = null;
function getMaxTexturesPerBatch() {
    var _gl_getExtension;
    if (maxTexturesPerBatchCache) return maxTexturesPerBatchCache;
    const gl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$getTestContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTestContext"])();
    maxTexturesPerBatchCache = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    maxTexturesPerBatchCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gl$2f$utils$2f$checkMaxIfStatementsInShader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["checkMaxIfStatementsInShader"])(maxTexturesPerBatchCache, gl);
    (_gl_getExtension = gl.getExtension("WEBGL_lose_context")) === null || _gl_getExtension === void 0 ? void 0 : _gl_getExtension.loseContext();
    return maxTexturesPerBatchCache;
}
;
 //# sourceMappingURL=maxRecommendedTextures.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/BatchTextureArray.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchTextureArray",
    ()=>BatchTextureArray
]);
"use strict";
class BatchTextureArray {
    /** Clear the textures and their locations. */ clear() {
        for(let i = 0; i < this.count; i++){
            const t = this.textures[i];
            this.textures[i] = null;
            this.ids[t.uid] = null;
        }
        this.count = 0;
    }
    constructor(){
        /** Respective locations for textures. */ this.ids = /* @__PURE__ */ Object.create(null);
        this.textures = [];
        this.count = 0;
    }
}
;
 //# sourceMappingURL=BatchTextureArray.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/Batcher.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Batch",
    ()=>Batch,
    "Batcher",
    ()=>Batcher
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$ViewableBuffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/ViewableBuffer.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/GlobalResourceRegistry.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$utils$2f$fastCopy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/utils/fastCopy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$getAdjustedBlendModeBlend$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/getAdjustedBlendModeBlend.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gl$2f$utils$2f$maxRecommendedTextures$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gl/utils/maxRecommendedTextures.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$BatchTextureArray$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/BatchTextureArray.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
"use strict";
class Batch {
    destroy() {
        this.textures = null;
        this.gpuBindGroup = null;
        this.bindGroup = null;
        this.batcher = null;
    }
    constructor(){
        this.renderPipeId = "batch";
        this.action = "startBatch";
        // TODO - eventually this could be useful for flagging batches as dirty and then only rebuilding those ones
        // public elementStart = 0;
        // public elementSize = 0;
        // for drawing..
        this.start = 0;
        this.size = 0;
        this.textures = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$BatchTextureArray$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BatchTextureArray"]();
        this.blendMode = "normal";
        this.topology = "triangle-strip";
        this.canBundle = true;
    }
}
const batchPool = [];
let batchPoolIndex = 0;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GlobalResourceRegistry"].register({
    clear: ()=>{
        if (batchPool.length > 0) {
            for (const item of batchPool){
                if (item) item.destroy();
            }
        }
        batchPool.length = 0;
        batchPoolIndex = 0;
    }
});
function getBatchFromPool() {
    return batchPoolIndex > 0 ? batchPool[--batchPoolIndex] : new Batch();
}
function returnBatchToPool(batch) {
    batchPool[batchPoolIndex++] = batch;
}
let BATCH_TICK = 0;
const _Batcher = class _Batcher {
    begin() {
        this.elementSize = 0;
        this.elementStart = 0;
        this.indexSize = 0;
        this.attributeSize = 0;
        for(let i = 0; i < this.batchIndex; i++){
            returnBatchToPool(this.batches[i]);
        }
        this.batchIndex = 0;
        this._batchIndexStart = 0;
        this._batchIndexSize = 0;
        this.dirty = true;
    }
    add(batchableObject) {
        this._elements[this.elementSize++] = batchableObject;
        batchableObject._indexStart = this.indexSize;
        batchableObject._attributeStart = this.attributeSize;
        batchableObject._batcher = this;
        this.indexSize += batchableObject.indexSize;
        this.attributeSize += batchableObject.attributeSize * this.vertexSize;
    }
    checkAndUpdateTexture(batchableObject, texture) {
        const textureId = batchableObject._batch.textures.ids[texture._source.uid];
        if (!textureId && textureId !== 0) return false;
        batchableObject._textureId = textureId;
        batchableObject.texture = texture;
        return true;
    }
    updateElement(batchableObject) {
        this.dirty = true;
        const attributeBuffer = this.attributeBuffer;
        if (batchableObject.packAsQuad) {
            this.packQuadAttributes(batchableObject, attributeBuffer.float32View, attributeBuffer.uint32View, batchableObject._attributeStart, batchableObject._textureId);
        } else {
            this.packAttributes(batchableObject, attributeBuffer.float32View, attributeBuffer.uint32View, batchableObject._attributeStart, batchableObject._textureId);
        }
    }
    /**
   * breaks the batcher. This happens when a batch gets too big,
   * or we need to switch to a different type of rendering (a filter for example)
   * @param instructionSet
   */ break(instructionSet) {
        const elements = this._elements;
        if (!elements[this.elementStart]) return;
        let batch = getBatchFromPool();
        let textureBatch = batch.textures;
        textureBatch.clear();
        const firstElement = elements[this.elementStart];
        let blendMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$getAdjustedBlendModeBlend$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAdjustedBlendModeBlend"])(firstElement.blendMode, firstElement.texture._source);
        let topology = firstElement.topology;
        if (this.attributeSize * 4 > this.attributeBuffer.size) {
            this._resizeAttributeBuffer(this.attributeSize * 4);
        }
        if (this.indexSize > this.indexBuffer.length) {
            this._resizeIndexBuffer(this.indexSize);
        }
        const f32 = this.attributeBuffer.float32View;
        const u32 = this.attributeBuffer.uint32View;
        const indexBuffer = this.indexBuffer;
        let size = this._batchIndexSize;
        let start = this._batchIndexStart;
        let action = "startBatch";
        const maxTextures = this.maxTextures;
        for(let i = this.elementStart; i < this.elementSize; ++i){
            const element = elements[i];
            elements[i] = null;
            const texture = element.texture;
            const source = texture._source;
            const adjustedBlendMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$getAdjustedBlendModeBlend$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAdjustedBlendModeBlend"])(element.blendMode, source);
            const breakRequired = blendMode !== adjustedBlendMode || topology !== element.topology;
            if (source._batchTick === BATCH_TICK && !breakRequired) {
                element._textureId = source._textureBindLocation;
                size += element.indexSize;
                if (element.packAsQuad) {
                    this.packQuadAttributes(element, f32, u32, element._attributeStart, element._textureId);
                    this.packQuadIndex(indexBuffer, element._indexStart, element._attributeStart / this.vertexSize);
                } else {
                    this.packAttributes(element, f32, u32, element._attributeStart, element._textureId);
                    this.packIndex(element, indexBuffer, element._indexStart, element._attributeStart / this.vertexSize);
                }
                element._batch = batch;
                continue;
            }
            source._batchTick = BATCH_TICK;
            if (textureBatch.count >= maxTextures || breakRequired) {
                this._finishBatch(batch, start, size - start, textureBatch, blendMode, topology, instructionSet, action);
                action = "renderBatch";
                start = size;
                blendMode = adjustedBlendMode;
                topology = element.topology;
                batch = getBatchFromPool();
                textureBatch = batch.textures;
                textureBatch.clear();
                ++BATCH_TICK;
            }
            element._textureId = source._textureBindLocation = textureBatch.count;
            textureBatch.ids[source.uid] = textureBatch.count;
            textureBatch.textures[textureBatch.count++] = source;
            element._batch = batch;
            size += element.indexSize;
            if (element.packAsQuad) {
                this.packQuadAttributes(element, f32, u32, element._attributeStart, element._textureId);
                this.packQuadIndex(indexBuffer, element._indexStart, element._attributeStart / this.vertexSize);
            } else {
                this.packAttributes(element, f32, u32, element._attributeStart, element._textureId);
                this.packIndex(element, indexBuffer, element._indexStart, element._attributeStart / this.vertexSize);
            }
        }
        if (textureBatch.count > 0) {
            this._finishBatch(batch, start, size - start, textureBatch, blendMode, topology, instructionSet, action);
            start = size;
            ++BATCH_TICK;
        }
        this.elementStart = this.elementSize;
        this._batchIndexStart = start;
        this._batchIndexSize = size;
    }
    _finishBatch(batch, indexStart, indexSize, textureBatch, blendMode, topology, instructionSet, action) {
        batch.gpuBindGroup = null;
        batch.bindGroup = null;
        batch.action = action;
        batch.batcher = this;
        batch.textures = textureBatch;
        batch.blendMode = blendMode;
        batch.topology = topology;
        batch.start = indexStart;
        batch.size = indexSize;
        ++BATCH_TICK;
        this.batches[this.batchIndex++] = batch;
        instructionSet.add(batch);
    }
    finish(instructionSet) {
        this.break(instructionSet);
    }
    /**
   * Resizes the attribute buffer to the given size (1 = 1 float32)
   * @param size - the size in vertices to ensure (not bytes!)
   */ ensureAttributeBuffer(size) {
        if (size * 4 <= this.attributeBuffer.size) return;
        this._resizeAttributeBuffer(size * 4);
    }
    /**
   * Resizes the index buffer to the given size (1 = 1 float32)
   * @param size - the size in vertices to ensure (not bytes!)
   */ ensureIndexBuffer(size) {
        if (size <= this.indexBuffer.length) return;
        this._resizeIndexBuffer(size);
    }
    _resizeAttributeBuffer(size) {
        const newSize = Math.max(size, this.attributeBuffer.size * 2);
        const newArrayBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$ViewableBuffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ViewableBuffer"](newSize);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$utils$2f$fastCopy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fastCopy"])(this.attributeBuffer.rawBinaryData, newArrayBuffer.rawBinaryData);
        this.attributeBuffer = newArrayBuffer;
    }
    _resizeIndexBuffer(size) {
        const indexBuffer = this.indexBuffer;
        let newSize = Math.max(size, indexBuffer.length * 1.5);
        newSize += newSize % 2;
        const newIndexBuffer = newSize > 65535 ? new Uint32Array(newSize) : new Uint16Array(newSize);
        if (newIndexBuffer.BYTES_PER_ELEMENT !== indexBuffer.BYTES_PER_ELEMENT) {
            for(let i = 0; i < indexBuffer.length; i++){
                newIndexBuffer[i] = indexBuffer[i];
            }
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$utils$2f$fastCopy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fastCopy"])(indexBuffer.buffer, newIndexBuffer.buffer);
        }
        this.indexBuffer = newIndexBuffer;
    }
    packQuadIndex(indexBuffer, index, indicesOffset) {
        indexBuffer[index] = indicesOffset + 0;
        indexBuffer[index + 1] = indicesOffset + 1;
        indexBuffer[index + 2] = indicesOffset + 2;
        indexBuffer[index + 3] = indicesOffset + 0;
        indexBuffer[index + 4] = indicesOffset + 2;
        indexBuffer[index + 5] = indicesOffset + 3;
    }
    packIndex(element, indexBuffer, index, indicesOffset) {
        const indices = element.indices;
        const size = element.indexSize;
        const indexOffset = element.indexOffset;
        const attributeOffset = element.attributeOffset;
        for(let i = 0; i < size; i++){
            indexBuffer[index++] = indicesOffset + indices[i + indexOffset] - attributeOffset;
        }
    }
    destroy() {
        if (this.batches === null) return;
        for(let i = 0; i < this.batches.length; i++){
            returnBatchToPool(this.batches[i]);
        }
        this.batches = null;
        for(let i = 0; i < this._elements.length; i++){
            if (this._elements[i]) this._elements[i]._batch = null;
        }
        this._elements = null;
        this.indexBuffer = null;
        this.attributeBuffer.destroy();
        this.attributeBuffer = null;
    }
    constructor(options){
        /** unique id for this batcher */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("batcher");
        /** Indicates whether the batch data has been modified and needs updating. */ this.dirty = true;
        /** The current index of the batch being processed. */ this.batchIndex = 0;
        /** An array of all batches created during the current rendering process. */ this.batches = [];
        this._elements = [];
        options = {
            ..._Batcher.defaultOptions,
            ...options
        };
        if (!options.maxTextures) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])("v8.8.0", "maxTextures is a required option for Batcher now, please pass it in the options");
            options.maxTextures = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gl$2f$utils$2f$maxRecommendedTextures$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMaxTexturesPerBatch"])();
        }
        const { maxTextures, attributesInitialSize, indicesInitialSize } = options;
        this.attributeBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$ViewableBuffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ViewableBuffer"](attributesInitialSize * 4);
        this.indexBuffer = new Uint16Array(indicesInitialSize);
        this.maxTextures = maxTextures;
    }
};
_Batcher.defaultOptions = {
    maxTextures: null,
    attributesInitialSize: 4,
    indicesInitialSize: 6
};
let Batcher = _Batcher;
;
 //# sourceMappingURL=Batcher.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/const.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BufferUsage",
    ()=>BufferUsage
]);
"use strict";
var BufferUsage = /* @__PURE__ */ ((BufferUsage2)=>{
    BufferUsage2[BufferUsage2["MAP_READ"] = 1] = "MAP_READ";
    BufferUsage2[BufferUsage2["MAP_WRITE"] = 2] = "MAP_WRITE";
    BufferUsage2[BufferUsage2["COPY_SRC"] = 4] = "COPY_SRC";
    BufferUsage2[BufferUsage2["COPY_DST"] = 8] = "COPY_DST";
    BufferUsage2[BufferUsage2["INDEX"] = 16] = "INDEX";
    BufferUsage2[BufferUsage2["VERTEX"] = 32] = "VERTEX";
    BufferUsage2[BufferUsage2["UNIFORM"] = 64] = "UNIFORM";
    BufferUsage2[BufferUsage2["STORAGE"] = 128] = "STORAGE";
    BufferUsage2[BufferUsage2["INDIRECT"] = 256] = "INDIRECT";
    BufferUsage2[BufferUsage2["QUERY_RESOLVE"] = 512] = "QUERY_RESOLVE";
    BufferUsage2[BufferUsage2["STATIC"] = 1024] = "STATIC";
    return BufferUsage2;
})(BufferUsage || {});
;
 //# sourceMappingURL=const.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/Buffer.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Buffer",
    ()=>Buffer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/const.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
class Buffer extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    /** the data in the buffer */ get data() {
        return this._data;
    }
    set data(value) {
        this.setDataWithSize(value, value.length, true);
    }
    get dataInt32() {
        if (!this._dataInt32) {
            this._dataInt32 = new Int32Array(this.data.buffer);
        }
        return this._dataInt32;
    }
    /** whether the buffer is static or not */ get static() {
        return !!(this.descriptor.usage & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].STATIC);
    }
    set static(value) {
        if (value) {
            this.descriptor.usage |= __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].STATIC;
        } else {
            this.descriptor.usage &= ~__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].STATIC;
        }
    }
    /**
   * Sets the data in the buffer to the given value. This will immediately update the buffer on the GPU.
   * If you only want to update a subset of the buffer, you can pass in the size of the data.
   * @param value - the data to set
   * @param size - the size of the data in bytes
   * @param syncGPU - should the buffer be updated on the GPU immediately?
   */ setDataWithSize(value, size, syncGPU) {
        this._updateID++;
        this._updateSize = size * value.BYTES_PER_ELEMENT;
        if (this._data === value) {
            if (syncGPU) this.emit("update", this);
            return;
        }
        const oldData = this._data;
        this._data = value;
        this._dataInt32 = null;
        if (!oldData || oldData.length !== value.length) {
            if (!this.shrinkToFit && oldData && value.byteLength < oldData.byteLength) {
                if (syncGPU) this.emit("update", this);
            } else {
                this.descriptor.size = value.byteLength;
                this._resourceId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("resource");
                this.emit("change", this);
            }
            return;
        }
        if (syncGPU) this.emit("update", this);
    }
    /**
   * updates the buffer on the GPU to reflect the data in the buffer.
   * By default it will update the entire buffer. If you only want to update a subset of the buffer,
   * you can pass in the size of the buffer to update.
   * @param sizeInBytes - the new size of the buffer in bytes
   */ update(sizeInBytes) {
        this._updateSize = sizeInBytes !== null && sizeInBytes !== void 0 ? sizeInBytes : this._updateSize;
        this._updateID++;
        this.emit("update", this);
    }
    /** Destroys the buffer */ destroy() {
        this.destroyed = true;
        this.emit("destroy", this);
        this.emit("change", this);
        this._data = null;
        this.descriptor = null;
        this.removeAllListeners();
    }
    /**
   * Creates a new Buffer with the given options
   * @param options - the options for the buffer
   */ constructor(options){
        let { data, size } = options;
        const { usage, label, shrinkToFit } = options;
        super();
        /**
     * emits when the underlying buffer has changed shape (i.e. resized)
     * letting the renderer know that it needs to discard the old buffer on the GPU and create a new one
     * @event change
     */ /**
     * emits when the underlying buffer data has been updated. letting the renderer know
     * that it needs to update the buffer on the GPU
     * @event update
     */ /**
     * emits when the buffer is destroyed. letting the renderer know that it needs to destroy the buffer on the GPU
     * @event destroy
     */ /** a unique id for this uniform group used through the renderer */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("buffer");
        /**
     * a resource type, used to identify how to handle it when its in a bind group / shader resource
     * @internal
     */ this._resourceType = "buffer";
        /**
     * the resource id used internally by the renderer to build bind group keys
     * @internal
     */ this._resourceId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("resource");
        /**
     * used internally to know if a uniform group was used in the last render pass
     * @internal
     */ this._touched = 0;
        /** @internal */ this._updateID = 1;
        this._dataInt32 = null;
        /**
     * should the GPU buffer be shrunk when the data becomes smaller?
     * changing this will cause the buffer to be destroyed and a new one created on the GPU
     * this can be expensive, especially if the buffer is already big enough!
     * setting this to false will prevent the buffer from being shrunk. This will yield better performance
     * if you are constantly setting data that is changing size often.
     * @default true
     */ this.shrinkToFit = true;
        /**
     * Has the buffer been destroyed?
     * @readonly
     */ this.destroyed = false;
        if (data instanceof Array) {
            data = new Float32Array(data);
        }
        this._data = data;
        size !== null && size !== void 0 ? size : size = data === null || data === void 0 ? void 0 : data.byteLength;
        const mappedAtCreation = !!data;
        this.descriptor = {
            size,
            usage,
            mappedAtCreation,
            label
        };
        this.shrinkToFit = shrinkToFit !== null && shrinkToFit !== void 0 ? shrinkToFit : true;
    }
}
;
 //# sourceMappingURL=Buffer.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/ensureIsBuffer.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ensureIsBuffer",
    ()=>ensureIsBuffer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/Buffer.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/const.mjs [app-client] (ecmascript)");
;
;
"use strict";
function ensureIsBuffer(buffer, index) {
    if (!(buffer instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"])) {
        let usage = index ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].INDEX : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].VERTEX;
        if (buffer instanceof Array) {
            if (index) {
                buffer = new Uint32Array(buffer);
                usage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].INDEX | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST;
            } else {
                buffer = new Float32Array(buffer);
                usage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].VERTEX | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST;
            }
        }
        buffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"]({
            data: buffer,
            label: index ? "index-mesh-buffer" : "vertex-mesh-buffer",
            usage
        });
    }
    return buffer;
}
;
 //# sourceMappingURL=ensureIsBuffer.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/getGeometryBounds.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getGeometryBounds",
    ()=>getGeometryBounds
]);
"use strict";
function getGeometryBounds(geometry, attributeId, bounds) {
    const attribute = geometry.getAttribute(attributeId);
    if (!attribute) {
        bounds.minX = 0;
        bounds.minY = 0;
        bounds.maxX = 0;
        bounds.maxY = 0;
        return bounds;
    }
    const data = attribute.buffer.data;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const byteSize = data.BYTES_PER_ELEMENT;
    const offset = (attribute.offset || 0) / byteSize;
    const stride = (attribute.stride || 2 * 4) / byteSize;
    for(let i = offset; i < data.length; i += stride){
        const x = data[i];
        const y = data[i + 1];
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
    }
    bounds.minX = minX;
    bounds.minY = minY;
    bounds.maxX = maxX;
    bounds.maxY = maxY;
    return bounds;
}
;
 //# sourceMappingURL=getGeometryBounds.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/Geometry.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Geometry",
    ()=>Geometry
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/Buffer.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$ensureIsBuffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/ensureIsBuffer.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getGeometryBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/getGeometryBounds.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
"use strict";
function ensureIsAttribute(attribute) {
    if (attribute instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"] || Array.isArray(attribute) || attribute.BYTES_PER_ELEMENT) {
        attribute = {
            buffer: attribute
        };
    }
    attribute.buffer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$ensureIsBuffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ensureIsBuffer"])(attribute.buffer, false);
    return attribute;
}
class Geometry extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    onBufferUpdate() {
        this._boundsDirty = true;
        this.emit("update", this);
    }
    /**
   * Returns the requested attribute.
   * @param id - The name of the attribute required
   * @returns - The attribute requested.
   */ getAttribute(id) {
        return this.attributes[id];
    }
    /**
   * Returns the index buffer
   * @returns - The index buffer.
   */ getIndex() {
        return this.indexBuffer;
    }
    /**
   * Returns the requested buffer.
   * @param id - The name of the buffer required.
   * @returns - The buffer requested.
   */ getBuffer(id) {
        return this.getAttribute(id).buffer;
    }
    /**
   * Used to figure out how many vertices there are in this geometry
   * @returns the number of vertices in the geometry
   */ getSize() {
        for(const i in this.attributes){
            const attribute = this.attributes[i];
            const buffer = attribute.buffer;
            return buffer.data.length / (attribute.stride / 4 || attribute.size);
        }
        return 0;
    }
    /**
   * Adds an attribute to the geometry.
   * @param name - The name of the attribute to add.
   * @param attributeOption - The attribute option to add.
   */ addAttribute(name, attributeOption) {
        const attribute = ensureIsAttribute(attributeOption);
        const bufferIndex = this.buffers.indexOf(attribute.buffer);
        if (bufferIndex === -1) {
            this.buffers.push(attribute.buffer);
            attribute.buffer.on("update", this.onBufferUpdate, this);
            attribute.buffer.on("change", this.onBufferUpdate, this);
        }
        this.attributes[name] = attribute;
    }
    /**
   * Adds an index buffer to the geometry.
   * @param indexBuffer - The index buffer to add. Can be a Buffer, TypedArray, or an array of numbers.
   */ addIndex(indexBuffer) {
        this.indexBuffer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$ensureIsBuffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ensureIsBuffer"])(indexBuffer, true);
        this.buffers.push(this.indexBuffer);
    }
    /** Returns the bounds of the geometry. */ get bounds() {
        if (!this._boundsDirty) return this._bounds;
        this._boundsDirty = false;
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getGeometryBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGeometryBounds"])(this, "aPosition", this._bounds);
    }
    /**
   * destroys the geometry.
   * @param destroyBuffers - destroy the buffers associated with this geometry
   */ destroy() {
        let destroyBuffers = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        this.emit("destroy", this);
        this.removeAllListeners();
        if (destroyBuffers) {
            this.buffers.forEach((buffer)=>buffer.destroy());
        }
        this.attributes = null;
        this.buffers = null;
        this.indexBuffer = null;
        this._bounds = null;
    }
    /**
   * Create a new instance of a geometry
   * @param options - The options for the geometry.
   */ constructor(options = {}){
        super();
        /** The unique id of the geometry. */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("geometry");
        /**
     * the layout key will be generated by WebGPU all geometries that have the same structure
     * will have the same layout key. This is used to cache the pipeline layout
     * @internal
     */ this._layoutKey = 0;
        /** the instance count of the geometry to draw */ this.instanceCount = 1;
        this._bounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Bounds"]();
        this._boundsDirty = true;
        const { attributes, indexBuffer, topology } = options;
        this.buffers = [];
        this.attributes = {};
        if (attributes) {
            for(const i in attributes){
                this.addAttribute(i, attributes[i]);
            }
        }
        var _options_instanceCount;
        this.instanceCount = (_options_instanceCount = options.instanceCount) !== null && _options_instanceCount !== void 0 ? _options_instanceCount : 1;
        if (indexBuffer) {
            this.addIndex(indexBuffer);
        }
        this.topology = topology || "triangle-list";
    }
}
;
 //# sourceMappingURL=Geometry.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/BatchGeometry.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchGeometry",
    ()=>BatchGeometry
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/Buffer.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/const.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$Geometry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/Geometry.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
const placeHolderBufferData = new Float32Array(1);
const placeHolderIndexData = new Uint32Array(1);
class BatchGeometry extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$Geometry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Geometry"] {
    constructor(){
        const vertexSize = 6;
        const attributeBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"]({
            data: placeHolderBufferData,
            label: "attribute-batch-buffer",
            usage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].VERTEX | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST,
            shrinkToFit: false
        });
        const indexBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"]({
            data: placeHolderIndexData,
            label: "index-batch-buffer",
            usage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].INDEX | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST,
            // | BufferUsage.STATIC,
            shrinkToFit: false
        });
        const stride = vertexSize * 4;
        super({
            attributes: {
                aPosition: {
                    buffer: attributeBuffer,
                    format: "float32x2",
                    stride,
                    offset: 0
                },
                aUV: {
                    buffer: attributeBuffer,
                    format: "float32x2",
                    stride,
                    offset: 2 * 4
                },
                aColor: {
                    buffer: attributeBuffer,
                    format: "unorm8x4",
                    stride,
                    offset: 4 * 4
                },
                aTextureIdAndRound: {
                    buffer: attributeBuffer,
                    format: "uint16x2",
                    stride,
                    offset: 5 * 4
                }
            },
            indexBuffer
        });
    }
}
;
 //# sourceMappingURL=BatchGeometry.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/utils/createIdFromString.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createIdFromString",
    ()=>createIdFromString
]);
"use strict";
const idCounts = /* @__PURE__ */ Object.create(null);
const idHash = /* @__PURE__ */ Object.create(null);
function createIdFromString(value, groupId) {
    let id = idHash[value];
    if (id === void 0) {
        if (idCounts[groupId] === void 0) {
            idCounts[groupId] = 1;
        }
        idHash[value] = id = idCounts[groupId]++;
    }
    return id;
}
;
 //# sourceMappingURL=createIdFromString.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getMaxFragmentPrecision.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMaxFragmentPrecision",
    ()=>getMaxFragmentPrecision
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$getTestContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getTestContext.mjs [app-client] (ecmascript)");
;
"use strict";
let maxFragmentPrecision;
function getMaxFragmentPrecision() {
    if (!maxFragmentPrecision) {
        maxFragmentPrecision = "mediump";
        const gl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$getTestContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTestContext"])();
        if (gl) {
            if (gl.getShaderPrecisionFormat) {
                const shaderFragment = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
                maxFragmentPrecision = shaderFragment.precision ? "highp" : "mediump";
            }
        }
    }
    return maxFragmentPrecision;
}
;
 //# sourceMappingURL=getMaxFragmentPrecision.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/preprocessors/addProgramDefines.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addProgramDefines",
    ()=>addProgramDefines
]);
"use strict";
function addProgramDefines(src, isES300, isFragment) {
    if (isES300) return src;
    if (isFragment) {
        src = src.replace("out vec4 finalColor;", "");
        return "\n\n        #ifdef GL_ES // This checks if it is WebGL1\n        #define in varying\n        #define finalColor gl_FragColor\n        #define texture texture2D\n        #endif\n        ".concat(src, "\n        ");
    }
    return "\n\n        #ifdef GL_ES // This checks if it is WebGL1\n        #define in attribute\n        #define out varying\n        #endif\n        ".concat(src, "\n        ");
}
;
 //# sourceMappingURL=addProgramDefines.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/preprocessors/ensurePrecision.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ensurePrecision",
    ()=>ensurePrecision
]);
"use strict";
function ensurePrecision(src, options, isFragment) {
    const maxSupportedPrecision = isFragment ? options.maxSupportedFragmentPrecision : options.maxSupportedVertexPrecision;
    if (src.substring(0, 9) !== "precision") {
        let precision = isFragment ? options.requestedFragmentPrecision : options.requestedVertexPrecision;
        if (precision === "highp" && maxSupportedPrecision !== "highp") {
            precision = "mediump";
        }
        return "precision ".concat(precision, " float;\n").concat(src);
    } else if (maxSupportedPrecision !== "highp" && src.substring(0, 15) === "precision highp") {
        return src.replace("precision highp", "precision mediump");
    }
    return src;
}
;
 //# sourceMappingURL=ensurePrecision.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/preprocessors/insertVersion.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "insertVersion",
    ()=>insertVersion
]);
"use strict";
function insertVersion(src, isES300) {
    if (!isES300) return src;
    return "#version 300 es\n".concat(src);
}
;
 //# sourceMappingURL=insertVersion.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/preprocessors/setProgramName.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "setProgramName",
    ()=>setProgramName
]);
"use strict";
const fragmentNameCache = {};
const VertexNameCache = {};
function setProgramName(src, param) {
    let { name = "pixi-program" } = param, isFragment = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    name = name.replace(/\s+/g, "-");
    name += isFragment ? "-fragment" : "-vertex";
    const nameCache = isFragment ? fragmentNameCache : VertexNameCache;
    if (nameCache[name]) {
        nameCache[name]++;
        name += "-".concat(nameCache[name]);
    } else {
        nameCache[name] = 1;
    }
    if (src.indexOf("#define SHADER_NAME") !== -1) return src;
    const shaderName = "#define SHADER_NAME ".concat(name);
    return "".concat(shaderName, "\n").concat(src);
}
;
 //# sourceMappingURL=setProgramName.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/preprocessors/stripVersion.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "stripVersion",
    ()=>stripVersion
]);
"use strict";
function stripVersion(src, isES300) {
    if (!isES300) return src;
    return src.replace("#version 300 es", "");
}
;
 //# sourceMappingURL=stripVersion.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgram.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlProgram",
    ()=>GlProgram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$utils$2f$createIdFromString$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/utils/createIdFromString.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$getMaxFragmentPrecision$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getMaxFragmentPrecision.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$preprocessors$2f$addProgramDefines$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/preprocessors/addProgramDefines.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$preprocessors$2f$ensurePrecision$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/preprocessors/ensurePrecision.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$preprocessors$2f$insertVersion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/preprocessors/insertVersion.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$preprocessors$2f$setProgramName$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/preprocessors/setProgramName.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$preprocessors$2f$stripVersion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/preprocessors/stripVersion.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
const processes = {
    // strips any version headers..
    stripVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$preprocessors$2f$stripVersion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stripVersion"],
    // adds precision string if not already present
    ensurePrecision: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$preprocessors$2f$ensurePrecision$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ensurePrecision"],
    // add some defines if WebGL1 to make it more compatible with WebGL2 shaders
    addProgramDefines: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$preprocessors$2f$addProgramDefines$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addProgramDefines"],
    // add the program name to the shader
    setProgramName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$preprocessors$2f$setProgramName$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setProgramName"],
    // add the version string to the shader header
    insertVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$preprocessors$2f$insertVersion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["insertVersion"]
};
const programCache = /* @__PURE__ */ Object.create(null);
const _GlProgram = class _GlProgram {
    /** destroys the program */ destroy() {
        this.fragment = null;
        this.vertex = null;
        this._attributeData = null;
        this._uniformData = null;
        this._uniformBlockData = null;
        this.transformFeedbackVaryings = null;
        programCache[this._cacheKey] = null;
    }
    /**
   * Helper function that creates a program for a given source.
   * It will check the program cache if the program has already been created.
   * If it has that one will be returned, if not a new one will be created and cached.
   * @param options - The options for the program.
   * @returns A program using the same source
   */ static from(options) {
        const key = "".concat(options.vertex, ":").concat(options.fragment);
        if (!programCache[key]) {
            programCache[key] = new _GlProgram(options);
            programCache[key]._cacheKey = key;
        }
        return programCache[key];
    }
    /**
   * Creates a shiny new GlProgram. Used by WebGL renderer.
   * @param options - The options for the program.
   */ constructor(options){
        options = {
            ..._GlProgram.defaultOptions,
            ...options
        };
        const isES300 = options.fragment.indexOf("#version 300 es") !== -1;
        const preprocessorOptions = {
            stripVersion: isES300,
            ensurePrecision: {
                requestedFragmentPrecision: options.preferredFragmentPrecision,
                requestedVertexPrecision: options.preferredVertexPrecision,
                maxSupportedVertexPrecision: "highp",
                maxSupportedFragmentPrecision: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$getMaxFragmentPrecision$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMaxFragmentPrecision"])()
            },
            setProgramName: {
                name: options.name
            },
            addProgramDefines: isES300,
            insertVersion: isES300
        };
        let fragment = options.fragment;
        let vertex = options.vertex;
        Object.keys(processes).forEach((processKey)=>{
            const processOptions = preprocessorOptions[processKey];
            fragment = processes[processKey](fragment, processOptions, true);
            vertex = processes[processKey](vertex, processOptions, false);
        });
        this.fragment = fragment;
        this.vertex = vertex;
        this.transformFeedbackVaryings = options.transformFeedbackVaryings;
        this._key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$utils$2f$createIdFromString$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createIdFromString"])("".concat(this.vertex, ":").concat(this.fragment), "gl-program");
    }
};
/** The default options used by the program. */ _GlProgram.defaultOptions = {
    preferredVertexPrecision: "highp",
    preferredFragmentPrecision: "mediump"
};
let GlProgram = _GlProgram;
;
 //# sourceMappingURL=GlProgram.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/getAttributeInfoFromFormat.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAttributeInfoFromFormat",
    ()=>getAttributeInfoFromFormat
]);
"use strict";
const attributeFormatData = {
    uint8x2: {
        size: 2,
        stride: 2,
        normalised: false
    },
    uint8x4: {
        size: 4,
        stride: 4,
        normalised: false
    },
    sint8x2: {
        size: 2,
        stride: 2,
        normalised: false
    },
    sint8x4: {
        size: 4,
        stride: 4,
        normalised: false
    },
    unorm8x2: {
        size: 2,
        stride: 2,
        normalised: true
    },
    unorm8x4: {
        size: 4,
        stride: 4,
        normalised: true
    },
    snorm8x2: {
        size: 2,
        stride: 2,
        normalised: true
    },
    snorm8x4: {
        size: 4,
        stride: 4,
        normalised: true
    },
    uint16x2: {
        size: 2,
        stride: 4,
        normalised: false
    },
    uint16x4: {
        size: 4,
        stride: 8,
        normalised: false
    },
    sint16x2: {
        size: 2,
        stride: 4,
        normalised: false
    },
    sint16x4: {
        size: 4,
        stride: 8,
        normalised: false
    },
    unorm16x2: {
        size: 2,
        stride: 4,
        normalised: true
    },
    unorm16x4: {
        size: 4,
        stride: 8,
        normalised: true
    },
    snorm16x2: {
        size: 2,
        stride: 4,
        normalised: true
    },
    snorm16x4: {
        size: 4,
        stride: 8,
        normalised: true
    },
    float16x2: {
        size: 2,
        stride: 4,
        normalised: false
    },
    float16x4: {
        size: 4,
        stride: 8,
        normalised: false
    },
    float32: {
        size: 1,
        stride: 4,
        normalised: false
    },
    float32x2: {
        size: 2,
        stride: 8,
        normalised: false
    },
    float32x3: {
        size: 3,
        stride: 12,
        normalised: false
    },
    float32x4: {
        size: 4,
        stride: 16,
        normalised: false
    },
    uint32: {
        size: 1,
        stride: 4,
        normalised: false
    },
    uint32x2: {
        size: 2,
        stride: 8,
        normalised: false
    },
    uint32x3: {
        size: 3,
        stride: 12,
        normalised: false
    },
    uint32x4: {
        size: 4,
        stride: 16,
        normalised: false
    },
    sint32: {
        size: 1,
        stride: 4,
        normalised: false
    },
    sint32x2: {
        size: 2,
        stride: 8,
        normalised: false
    },
    sint32x3: {
        size: 3,
        stride: 12,
        normalised: false
    },
    sint32x4: {
        size: 4,
        stride: 16,
        normalised: false
    }
};
function getAttributeInfoFromFormat(format) {
    var _attributeFormatData_format;
    return (_attributeFormatData_format = attributeFormatData[format]) !== null && _attributeFormatData_format !== void 0 ? _attributeFormatData_format : attributeFormatData.float32;
}
;
 //# sourceMappingURL=getAttributeInfoFromFormat.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/extractAttributesFromGpuProgram.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extractAttributesFromGpuProgram",
    ()=>extractAttributesFromGpuProgram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/getAttributeInfoFromFormat.mjs [app-client] (ecmascript)");
;
"use strict";
const WGSL_TO_VERTEX_TYPES = {
    f32: "float32",
    "vec2<f32>": "float32x2",
    "vec3<f32>": "float32x3",
    "vec4<f32>": "float32x4",
    vec2f: "float32x2",
    vec3f: "float32x3",
    vec4f: "float32x4",
    i32: "sint32",
    "vec2<i32>": "sint32x2",
    "vec3<i32>": "sint32x3",
    "vec4<i32>": "sint32x4",
    u32: "uint32",
    "vec2<u32>": "uint32x2",
    "vec3<u32>": "uint32x3",
    "vec4<u32>": "uint32x4",
    bool: "uint32",
    "vec2<bool>": "uint32x2",
    "vec3<bool>": "uint32x3",
    "vec4<bool>": "uint32x4"
};
function extractAttributesFromGpuProgram(param) {
    let { source, entryPoint } = param;
    const results = {};
    const mainVertStart = source.indexOf("fn ".concat(entryPoint));
    if (mainVertStart !== -1) {
        const arrowFunctionStart = source.indexOf("->", mainVertStart);
        if (arrowFunctionStart !== -1) {
            const functionArgsSubstring = source.substring(mainVertStart, arrowFunctionStart);
            const inputsRegex = /@location\((\d+)\)\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_<>]+)(?:,|\s|$)/g;
            let match;
            while((match = inputsRegex.exec(functionArgsSubstring)) !== null){
                var _WGSL_TO_VERTEX_TYPES_match_;
                const format = (_WGSL_TO_VERTEX_TYPES_match_ = WGSL_TO_VERTEX_TYPES[match[3]]) !== null && _WGSL_TO_VERTEX_TYPES_match_ !== void 0 ? _WGSL_TO_VERTEX_TYPES_match_ : "float32";
                results[match[2]] = {
                    location: parseInt(match[1], 10),
                    format,
                    stride: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAttributeInfoFromFormat"])(format).stride,
                    offset: 0,
                    instance: false,
                    start: 0
                };
            }
        }
    }
    return results;
}
;
 //# sourceMappingURL=extractAttributesFromGpuProgram.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/extractStructAndGroups.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extractStructAndGroups",
    ()=>extractStructAndGroups
]);
"use strict";
function extractStructAndGroups(wgsl) {
    var _wgsl_match, _wgsl_match1;
    const linePattern = /(^|[^/])@(group|binding)\(\d+\)[^;]+;/g;
    const groupPattern = /@group\((\d+)\)/;
    const bindingPattern = /@binding\((\d+)\)/;
    const namePattern = /var(<[^>]+>)? (\w+)/;
    const typePattern = /:\s*(\w+)/;
    const structPattern = /struct\s+(\w+)\s*{([^}]+)}/g;
    const structMemberPattern = /(\w+)\s*:\s*([\w\<\>]+)/g;
    const structName = /struct\s+(\w+)/;
    const groups = (_wgsl_match = wgsl.match(linePattern)) === null || _wgsl_match === void 0 ? void 0 : _wgsl_match.map((item)=>({
            group: parseInt(item.match(groupPattern)[1], 10),
            binding: parseInt(item.match(bindingPattern)[1], 10),
            name: item.match(namePattern)[2],
            isUniform: item.match(namePattern)[1] === "<uniform>",
            type: item.match(typePattern)[1]
        }));
    if (!groups) {
        return {
            groups: [],
            structs: []
        };
    }
    var _wgsl_match_map_filter;
    const structs = (_wgsl_match_map_filter = (_wgsl_match1 = wgsl.match(structPattern)) === null || _wgsl_match1 === void 0 ? void 0 : _wgsl_match1.map((struct)=>{
        const name = struct.match(structName)[1];
        const members = struct.match(structMemberPattern).reduce((acc, member)=>{
            const [name2, type] = member.split(":");
            acc[name2.trim()] = type.trim();
            return acc;
        }, {});
        if (!members) {
            return null;
        }
        return {
            name,
            members
        };
    }).filter((param)=>{
        let { name } = param;
        return groups.some((group)=>group.type === name);
    })) !== null && _wgsl_match_map_filter !== void 0 ? _wgsl_match_map_filter : [];
    return {
        groups,
        structs
    };
}
;
 //# sourceMappingURL=extractStructAndGroups.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/const.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ShaderStage",
    ()=>ShaderStage
]);
"use strict";
var ShaderStage = /* @__PURE__ */ ((ShaderStage2)=>{
    ShaderStage2[ShaderStage2["VERTEX"] = 1] = "VERTEX";
    ShaderStage2[ShaderStage2["FRAGMENT"] = 2] = "FRAGMENT";
    ShaderStage2[ShaderStage2["COMPUTE"] = 4] = "COMPUTE";
    return ShaderStage2;
})(ShaderStage || {});
;
 //# sourceMappingURL=const.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/generateGpuLayoutGroups.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateGpuLayoutGroups",
    ()=>generateGpuLayoutGroups
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/const.mjs [app-client] (ecmascript)");
;
"use strict";
function generateGpuLayoutGroups(param) {
    let { groups } = param;
    const layout = [];
    for(let i = 0; i < groups.length; i++){
        const group = groups[i];
        if (!layout[group.group]) {
            layout[group.group] = [];
        }
        if (group.isUniform) {
            layout[group.group].push({
                binding: group.binding,
                visibility: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShaderStage"].VERTEX | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShaderStage"].FRAGMENT,
                buffer: {
                    type: "uniform"
                }
            });
        } else if (group.type === "sampler") {
            layout[group.group].push({
                binding: group.binding,
                visibility: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShaderStage"].FRAGMENT,
                sampler: {
                    type: "filtering"
                }
            });
        } else if (group.type === "texture_2d") {
            layout[group.group].push({
                binding: group.binding,
                visibility: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShaderStage"].FRAGMENT,
                texture: {
                    sampleType: "float",
                    viewDimension: "2d",
                    multisampled: false
                }
            });
        }
    }
    return layout;
}
;
 //# sourceMappingURL=generateGpuLayoutGroups.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/generateLayoutHash.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateLayoutHash",
    ()=>generateLayoutHash
]);
"use strict";
function generateLayoutHash(param) {
    let { groups } = param;
    const layout = [];
    for(let i = 0; i < groups.length; i++){
        const group = groups[i];
        if (!layout[group.group]) {
            layout[group.group] = {};
        }
        layout[group.group][group.name] = group.binding;
    }
    return layout;
}
;
 //# sourceMappingURL=generateLayoutHash.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/removeStructAndGroupDuplicates.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "removeStructAndGroupDuplicates",
    ()=>removeStructAndGroupDuplicates
]);
"use strict";
function removeStructAndGroupDuplicates(vertexStructsAndGroups, fragmentStructsAndGroups) {
    const structNameSet = /* @__PURE__ */ new Set();
    const dupeGroupKeySet = /* @__PURE__ */ new Set();
    const structs = [
        ...vertexStructsAndGroups.structs,
        ...fragmentStructsAndGroups.structs
    ].filter((struct)=>{
        if (structNameSet.has(struct.name)) {
            return false;
        }
        structNameSet.add(struct.name);
        return true;
    });
    const groups = [
        ...vertexStructsAndGroups.groups,
        ...fragmentStructsAndGroups.groups
    ].filter((group)=>{
        const key = "".concat(group.name, "-").concat(group.binding);
        if (dupeGroupKeySet.has(key)) {
            return false;
        }
        dupeGroupKeySet.add(key);
        return true;
    });
    return {
        structs,
        groups
    };
}
;
 //# sourceMappingURL=removeStructAndGroupDuplicates.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuProgram.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuProgram",
    ()=>GpuProgram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$utils$2f$createIdFromString$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/utils/createIdFromString.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$extractAttributesFromGpuProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/extractAttributesFromGpuProgram.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$extractStructAndGroups$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/extractStructAndGroups.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$generateGpuLayoutGroups$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/generateGpuLayoutGroups.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$generateLayoutHash$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/generateLayoutHash.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$removeStructAndGroupDuplicates$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/removeStructAndGroupDuplicates.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
"use strict";
const programCache = /* @__PURE__ */ Object.create(null);
class GpuProgram {
    // TODO maker this pure
    _generateProgramKey() {
        const { vertex, fragment } = this;
        const bigKey = vertex.source + fragment.source + vertex.entryPoint + fragment.entryPoint;
        this._layoutKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$utils$2f$createIdFromString$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createIdFromString"])(bigKey, "program");
    }
    get attributeData() {
        var _this__attributeData;
        (_this__attributeData = this._attributeData) !== null && _this__attributeData !== void 0 ? _this__attributeData : this._attributeData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$extractAttributesFromGpuProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractAttributesFromGpuProgram"])(this.vertex);
        return this._attributeData;
    }
    /** destroys the program */ destroy() {
        this.gpuLayout = null;
        this.layout = null;
        this.structsAndGroups = null;
        this.fragment = null;
        this.vertex = null;
        programCache[this._cacheKey] = null;
    }
    /**
   * Helper function that creates a program for a given source.
   * It will check the program cache if the program has already been created.
   * If it has that one will be returned, if not a new one will be created and cached.
   * @param options - The options for the program.
   * @returns A program using the same source
   */ static from(options) {
        const key = "".concat(options.vertex.source, ":").concat(options.fragment.source, ":").concat(options.fragment.entryPoint, ":").concat(options.vertex.entryPoint);
        if (!programCache[key]) {
            programCache[key] = new GpuProgram(options);
            programCache[key]._cacheKey = key;
        }
        return programCache[key];
    }
    /**
   * Create a new GpuProgram
   * @param options - The options for the gpu program
   */ constructor(options){
        var _this_layout_, _this_layout_1;
        /** @internal */ this._layoutKey = 0;
        /** @internal */ this._attributeLocationsKey = 0;
        const { fragment, vertex, layout, gpuLayout, name } = options;
        this.name = name;
        this.fragment = fragment;
        this.vertex = vertex;
        if (fragment.source === vertex.source) {
            const structsAndGroups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$extractStructAndGroups$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractStructAndGroups"])(fragment.source);
            this.structsAndGroups = structsAndGroups;
        } else {
            const vertexStructsAndGroups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$extractStructAndGroups$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractStructAndGroups"])(vertex.source);
            const fragmentStructsAndGroups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$extractStructAndGroups$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractStructAndGroups"])(fragment.source);
            this.structsAndGroups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$removeStructAndGroupDuplicates$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeStructAndGroupDuplicates"])(vertexStructsAndGroups, fragmentStructsAndGroups);
        }
        this.layout = layout !== null && layout !== void 0 ? layout : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$generateLayoutHash$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateLayoutHash"])(this.structsAndGroups);
        this.gpuLayout = gpuLayout !== null && gpuLayout !== void 0 ? gpuLayout : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$generateGpuLayoutGroups$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateGpuLayoutGroups"])(this.structsAndGroups);
        this.autoAssignGlobalUniforms = !!(((_this_layout_ = this.layout[0]) === null || _this_layout_ === void 0 ? void 0 : _this_layout_.globalUniforms) !== void 0);
        this.autoAssignLocalUniforms = !!(((_this_layout_1 = this.layout[1]) === null || _this_layout_1 === void 0 ? void 0 : _this_layout_1.localUniforms) !== void 0);
        this._generateProgramKey();
    }
}
;
 //# sourceMappingURL=GpuProgram.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/utils/addBits.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addBits",
    ()=>addBits
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-client] (ecmascript)");
;
"use strict";
function addBits(srcParts, parts, name) {
    if (srcParts) {
        for(const i in srcParts){
            const id = i.toLocaleLowerCase();
            const part = parts[id];
            if (part) {
                let sanitisedPart = srcParts[i];
                if (i === "header") {
                    sanitisedPart = sanitisedPart.replace(/@in\s+[^;]+;\s*/g, "").replace(/@out\s+[^;]+;\s*/g, "");
                }
                if (name) {
                    part.push("//----".concat(name, "----//"));
                }
                part.push(sanitisedPart);
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])("".concat(i, " placement hook does not exist in shader"));
            }
        }
    }
}
;
 //# sourceMappingURL=addBits.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/utils/compileHooks.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compileHooks",
    ()=>compileHooks
]);
"use strict";
const findHooksRx = /\{\{(.*?)\}\}/g;
function compileHooks(programSrc) {
    var _programSrc_match;
    const parts = {};
    var _programSrc_match_map;
    const partMatches = (_programSrc_match_map = (_programSrc_match = programSrc.match(findHooksRx)) === null || _programSrc_match === void 0 ? void 0 : _programSrc_match.map((hook)=>hook.replace(/[{()}]/g, ""))) !== null && _programSrc_match_map !== void 0 ? _programSrc_match_map : [];
    partMatches.forEach((hook)=>{
        parts[hook] = [];
    });
    return parts;
}
;
 //# sourceMappingURL=compileHooks.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/utils/compileInputs.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compileInputs",
    ()=>compileInputs
]);
"use strict";
function extractInputs(fragmentSource, out) {
    let match;
    const regex = /@in\s+([^;]+);/g;
    while((match = regex.exec(fragmentSource)) !== null){
        out.push(match[1]);
    }
}
function compileInputs(fragments, template) {
    let sort = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
    const results = [];
    extractInputs(template, results);
    fragments.forEach((fragment)=>{
        if (fragment.header) {
            extractInputs(fragment.header, results);
        }
    });
    const mainInput = results;
    if (sort) {
        mainInput.sort();
    }
    const finalString = mainInput.map((inValue, i)=>"       @location(".concat(i, ") ").concat(inValue, ",")).join("\n");
    let cleanedString = template.replace(/@in\s+[^;]+;\s*/g, "");
    cleanedString = cleanedString.replace("{{in}}", "\n".concat(finalString, "\n"));
    return cleanedString;
}
;
 //# sourceMappingURL=compileInputs.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/utils/compileOutputs.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compileOutputs",
    ()=>compileOutputs
]);
"use strict";
function extractOutputs(fragmentSource, out) {
    let match;
    const regex = /@out\s+([^;]+);/g;
    while((match = regex.exec(fragmentSource)) !== null){
        out.push(match[1]);
    }
}
function extractVariableName(value) {
    const regex = /\b(\w+)\s*:/g;
    const match = regex.exec(value);
    return match ? match[1] : "";
}
function stripVariable(value) {
    const regex = /@.*?\s+/g;
    return value.replace(regex, "");
}
function compileOutputs(fragments, template) {
    const results = [];
    extractOutputs(template, results);
    fragments.forEach((fragment)=>{
        if (fragment.header) {
            extractOutputs(fragment.header, results);
        }
    });
    let index = 0;
    const mainStruct = results.sort().map((inValue)=>{
        if (inValue.indexOf("builtin") > -1) {
            return inValue;
        }
        return "@location(".concat(index++, ") ").concat(inValue);
    }).join(",\n");
    const mainStart = results.sort().map((inValue)=>"       var ".concat(stripVariable(inValue), ";")).join("\n");
    const mainEnd = "return VSOutput(\n            ".concat(results.sort().map((inValue)=>" ".concat(extractVariableName(inValue))).join(",\n"), ");");
    let compiledCode = template.replace(/@out\s+[^;]+;\s*/g, "");
    compiledCode = compiledCode.replace("{{struct}}", "\n".concat(mainStruct, "\n"));
    compiledCode = compiledCode.replace("{{start}}", "\n".concat(mainStart, "\n"));
    compiledCode = compiledCode.replace("{{return}}", "\n".concat(mainEnd, "\n"));
    return compiledCode;
}
;
 //# sourceMappingURL=compileOutputs.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/utils/injectBits.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "injectBits",
    ()=>injectBits
]);
"use strict";
function injectBits(templateSrc, fragmentParts) {
    let out = templateSrc;
    for(const i in fragmentParts){
        const parts = fragmentParts[i];
        const toInject = parts.join("\n");
        if (toInject.length) {
            out = out.replace("{{".concat(i, "}}"), "//-----".concat(i, " START-----//\n").concat(parts.join("\n"), "\n//----").concat(i, " FINISH----//"));
        } else {
            out = out.replace("{{".concat(i, "}}"), "");
        }
    }
    return out;
}
;
 //# sourceMappingURL=injectBits.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/compileHighShader.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compileHighShader",
    ()=>compileHighShader,
    "compileHighShaderGl",
    ()=>compileHighShaderGl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$addBits$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/utils/addBits.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$compileHooks$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/utils/compileHooks.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$compileInputs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/utils/compileInputs.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$compileOutputs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/utils/compileOutputs.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$injectBits$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/utils/injectBits.mjs [app-client] (ecmascript)");
;
;
;
;
;
"use strict";
const cacheMap = /* @__PURE__ */ Object.create(null);
const bitCacheMap = /* @__PURE__ */ new Map();
let CACHE_UID = 0;
function compileHighShader(param) {
    let { template, bits } = param;
    const cacheId = generateCacheId(template, bits);
    if (cacheMap[cacheId]) return cacheMap[cacheId];
    const { vertex, fragment } = compileInputsAndOutputs(template, bits);
    cacheMap[cacheId] = compileBits(vertex, fragment, bits);
    return cacheMap[cacheId];
}
function compileHighShaderGl(param) {
    let { template, bits } = param;
    const cacheId = generateCacheId(template, bits);
    if (cacheMap[cacheId]) return cacheMap[cacheId];
    cacheMap[cacheId] = compileBits(template.vertex, template.fragment, bits);
    return cacheMap[cacheId];
}
function compileInputsAndOutputs(template, bits) {
    const vertexFragments = bits.map((shaderBit)=>shaderBit.vertex).filter((v)=>!!v);
    const fragmentFragments = bits.map((shaderBit)=>shaderBit.fragment).filter((v)=>!!v);
    let compiledVertex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$compileInputs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compileInputs"])(vertexFragments, template.vertex, true);
    compiledVertex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$compileOutputs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compileOutputs"])(vertexFragments, compiledVertex);
    const compiledFragment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$compileInputs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compileInputs"])(fragmentFragments, template.fragment, true);
    return {
        vertex: compiledVertex,
        fragment: compiledFragment
    };
}
function generateCacheId(template, bits) {
    return bits.map((highFragment)=>{
        if (!bitCacheMap.has(highFragment)) {
            bitCacheMap.set(highFragment, CACHE_UID++);
        }
        return bitCacheMap.get(highFragment);
    }).sort((a, b)=>a - b).join("-") + template.vertex + template.fragment;
}
function compileBits(vertex, fragment, bits) {
    const vertexParts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$compileHooks$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compileHooks"])(vertex);
    const fragmentParts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$compileHooks$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compileHooks"])(fragment);
    bits.forEach((shaderBit)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$addBits$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addBits"])(shaderBit.vertex, vertexParts, shaderBit.name);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$addBits$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addBits"])(shaderBit.fragment, fragmentParts, shaderBit.name);
    });
    return {
        vertex: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$injectBits$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["injectBits"])(vertex, vertexParts),
        fragment: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$utils$2f$injectBits$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["injectBits"])(fragment, fragmentParts)
    };
}
;
 //# sourceMappingURL=compileHighShader.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/defaultProgramTemplate.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fragmentGPUTemplate",
    ()=>fragmentGPUTemplate,
    "fragmentGlTemplate",
    ()=>fragmentGlTemplate,
    "vertexGPUTemplate",
    ()=>vertexGPUTemplate,
    "vertexGlTemplate",
    ()=>vertexGlTemplate
]);
"use strict";
const vertexGPUTemplate = "\n    @in aPosition: vec2<f32>;\n    @in aUV: vec2<f32>;\n\n    @out @builtin(position) vPosition: vec4<f32>;\n    @out vUV : vec2<f32>;\n    @out vColor : vec4<f32>;\n\n    {{header}}\n\n    struct VSOutput {\n        {{struct}}\n    };\n\n    @vertex\n    fn main( {{in}} ) -> VSOutput {\n\n        var worldTransformMatrix = globalUniforms.uWorldTransformMatrix;\n        var modelMatrix = mat3x3<f32>(\n            1.0, 0.0, 0.0,\n            0.0, 1.0, 0.0,\n            0.0, 0.0, 1.0\n          );\n        var position = aPosition;\n        var uv = aUV;\n\n        {{start}}\n\n        vColor = vec4<f32>(1., 1., 1., 1.);\n\n        {{main}}\n\n        vUV = uv;\n\n        var modelViewProjectionMatrix = globalUniforms.uProjectionMatrix * worldTransformMatrix * modelMatrix;\n\n        vPosition =  vec4<f32>((modelViewProjectionMatrix *  vec3<f32>(position, 1.0)).xy, 0.0, 1.0);\n\n        vColor *= globalUniforms.uWorldColorAlpha;\n\n        {{end}}\n\n        {{return}}\n    };\n";
const fragmentGPUTemplate = "\n    @in vUV : vec2<f32>;\n    @in vColor : vec4<f32>;\n\n    {{header}}\n\n    @fragment\n    fn main(\n        {{in}}\n      ) -> @location(0) vec4<f32> {\n\n        {{start}}\n\n        var outColor:vec4<f32>;\n\n        {{main}}\n\n        var finalColor:vec4<f32> = outColor * vColor;\n\n        {{end}}\n\n        return finalColor;\n      };\n";
const vertexGlTemplate = "\n    in vec2 aPosition;\n    in vec2 aUV;\n\n    out vec4 vColor;\n    out vec2 vUV;\n\n    {{header}}\n\n    void main(void){\n\n        mat3 worldTransformMatrix = uWorldTransformMatrix;\n        mat3 modelMatrix = mat3(\n            1.0, 0.0, 0.0,\n            0.0, 1.0, 0.0,\n            0.0, 0.0, 1.0\n          );\n        vec2 position = aPosition;\n        vec2 uv = aUV;\n\n        {{start}}\n\n        vColor = vec4(1.);\n\n        {{main}}\n\n        vUV = uv;\n\n        mat3 modelViewProjectionMatrix = uProjectionMatrix * worldTransformMatrix * modelMatrix;\n\n        gl_Position = vec4((modelViewProjectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n\n        vColor *= uWorldColorAlpha;\n\n        {{end}}\n    }\n";
const fragmentGlTemplate = "\n\n    in vec4 vColor;\n    in vec2 vUV;\n\n    out vec4 finalColor;\n\n    {{header}}\n\n    void main(void) {\n\n        {{start}}\n\n        vec4 outColor;\n\n        {{main}}\n\n        finalColor = outColor * vColor;\n\n        {{end}}\n    }\n";
;
 //# sourceMappingURL=defaultProgramTemplate.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/globalUniformsBit.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "globalUniformsBit",
    ()=>globalUniformsBit,
    "globalUniformsBitGl",
    ()=>globalUniformsBitGl,
    "globalUniformsUBOBitGl",
    ()=>globalUniformsUBOBitGl
]);
"use strict";
const globalUniformsBit = {
    name: "global-uniforms-bit",
    vertex: {
        header: "\n        struct GlobalUniforms {\n            uProjectionMatrix:mat3x3<f32>,\n            uWorldTransformMatrix:mat3x3<f32>,\n            uWorldColorAlpha: vec4<f32>,\n            uResolution: vec2<f32>,\n        }\n\n        @group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;\n        "
    }
};
const globalUniformsUBOBitGl = {
    name: "global-uniforms-ubo-bit",
    vertex: {
        header: "\n          uniform globalUniforms {\n            mat3 uProjectionMatrix;\n            mat3 uWorldTransformMatrix;\n            vec4 uWorldColorAlpha;\n            vec2 uResolution;\n          };\n        "
    }
};
const globalUniformsBitGl = {
    name: "global-uniforms-bit",
    vertex: {
        header: "\n          uniform mat3 uProjectionMatrix;\n          uniform mat3 uWorldTransformMatrix;\n          uniform vec4 uWorldColorAlpha;\n          uniform vec2 uResolution;\n        "
    }
};
;
 //# sourceMappingURL=globalUniformsBit.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compileHighShaderToProgram.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compileHighShaderGlProgram",
    ()=>compileHighShaderGlProgram,
    "compileHighShaderGpuProgram",
    ()=>compileHighShaderGpuProgram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgram.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuProgram.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$compileHighShader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compiler/compileHighShader.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$defaultProgramTemplate$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/defaultProgramTemplate.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$globalUniformsBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/globalUniformsBit.mjs [app-client] (ecmascript)");
;
;
;
;
;
"use strict";
function compileHighShaderGpuProgram(param) {
    let { bits, name } = param;
    const source = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$compileHighShader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compileHighShader"])({
        template: {
            fragment: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$defaultProgramTemplate$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fragmentGPUTemplate"],
            vertex: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$defaultProgramTemplate$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["vertexGPUTemplate"]
        },
        bits: [
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$globalUniformsBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalUniformsBit"],
            ...bits
        ]
    });
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GpuProgram"].from({
        name,
        vertex: {
            source: source.vertex,
            entryPoint: "main"
        },
        fragment: {
            source: source.fragment,
            entryPoint: "main"
        }
    });
}
function compileHighShaderGlProgram(param) {
    let { bits, name } = param;
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GlProgram"]({
        name,
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compiler$2f$compileHighShader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compileHighShaderGl"])({
            template: {
                vertex: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$defaultProgramTemplate$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["vertexGlTemplate"],
                fragment: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$defaultProgramTemplate$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fragmentGlTemplate"]
            },
            bits: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$globalUniformsBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalUniformsBitGl"],
                ...bits
            ]
        })
    });
}
;
 //# sourceMappingURL=compileHighShaderToProgram.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/colorBit.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "colorBit",
    ()=>colorBit,
    "colorBitGl",
    ()=>colorBitGl
]);
"use strict";
const colorBit = {
    name: "color-bit",
    vertex: {
        header: "\n            @in aColor: vec4<f32>;\n        ",
        main: "\n            vColor *= vec4<f32>(aColor.rgb * aColor.a, aColor.a);\n        "
    }
};
const colorBitGl = {
    name: "color-bit",
    vertex: {
        header: "\n            in vec4 aColor;\n        ",
        main: "\n            vColor *= vec4(aColor.rgb * aColor.a, aColor.a);\n        "
    }
};
;
 //# sourceMappingURL=colorBit.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/generateTextureBatchBit.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateTextureBatchBit",
    ()=>generateTextureBatchBit,
    "generateTextureBatchBitGl",
    ()=>generateTextureBatchBitGl
]);
"use strict";
const textureBatchBitGpuCache = {};
function generateBindingSrc(maxTextures) {
    const src = [];
    if (maxTextures === 1) {
        src.push("@group(1) @binding(0) var textureSource1: texture_2d<f32>;");
        src.push("@group(1) @binding(1) var textureSampler1: sampler;");
    } else {
        let bindingIndex = 0;
        for(let i = 0; i < maxTextures; i++){
            src.push("@group(1) @binding(".concat(bindingIndex++, ") var textureSource").concat(i + 1, ": texture_2d<f32>;"));
            src.push("@group(1) @binding(".concat(bindingIndex++, ") var textureSampler").concat(i + 1, ": sampler;"));
        }
    }
    return src.join("\n");
}
function generateSampleSrc(maxTextures) {
    const src = [];
    if (maxTextures === 1) {
        src.push("outColor = textureSampleGrad(textureSource1, textureSampler1, vUV, uvDx, uvDy);");
    } else {
        src.push("switch vTextureId {");
        for(let i = 0; i < maxTextures; i++){
            if (i === maxTextures - 1) {
                src.push("  default:{");
            } else {
                src.push("  case ".concat(i, ":{"));
            }
            src.push("      outColor = textureSampleGrad(textureSource".concat(i + 1, ", textureSampler").concat(i + 1, ", vUV, uvDx, uvDy);"));
            src.push("      break;}");
        }
        src.push("}");
    }
    return src.join("\n");
}
function generateTextureBatchBit(maxTextures) {
    if (!textureBatchBitGpuCache[maxTextures]) {
        textureBatchBitGpuCache[maxTextures] = {
            name: "texture-batch-bit",
            vertex: {
                header: "\n                @in aTextureIdAndRound: vec2<u32>;\n                @out @interpolate(flat) vTextureId : u32;\n            ",
                main: "\n                vTextureId = aTextureIdAndRound.y;\n            ",
                end: "\n                if(aTextureIdAndRound.x == 1)\n                {\n                    vPosition = vec4<f32>(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);\n                }\n            "
            },
            fragment: {
                header: "\n                @in @interpolate(flat) vTextureId: u32;\n\n                ".concat(generateBindingSrc(maxTextures), "\n            "),
                main: "\n                var uvDx = dpdx(vUV);\n                var uvDy = dpdy(vUV);\n\n                ".concat(generateSampleSrc(maxTextures), "\n            ")
            }
        };
    }
    return textureBatchBitGpuCache[maxTextures];
}
const textureBatchBitGlCache = {};
function generateSampleGlSrc(maxTextures) {
    const src = [];
    for(let i = 0; i < maxTextures; i++){
        if (i > 0) {
            src.push("else");
        }
        if (i < maxTextures - 1) {
            src.push("if(vTextureId < ".concat(i, ".5)"));
        }
        src.push("{");
        src.push("	outColor = texture(uTextures[".concat(i, "], vUV);"));
        src.push("}");
    }
    return src.join("\n");
}
function generateTextureBatchBitGl(maxTextures) {
    if (!textureBatchBitGlCache[maxTextures]) {
        textureBatchBitGlCache[maxTextures] = {
            name: "texture-batch-bit",
            vertex: {
                header: "\n                in vec2 aTextureIdAndRound;\n                out float vTextureId;\n\n            ",
                main: "\n                vTextureId = aTextureIdAndRound.y;\n            ",
                end: "\n                if(aTextureIdAndRound.x == 1.)\n                {\n                    gl_Position.xy = roundPixels(gl_Position.xy, uResolution);\n                }\n            "
            },
            fragment: {
                header: "\n                in float vTextureId;\n\n                uniform sampler2D uTextures[".concat(maxTextures, "];\n\n            "),
                main: "\n\n                ".concat(generateSampleGlSrc(maxTextures), "\n            ")
            }
        };
    }
    return textureBatchBitGlCache[maxTextures];
}
;
 //# sourceMappingURL=generateTextureBatchBit.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/roundPixelsBit.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "roundPixelsBit",
    ()=>roundPixelsBit,
    "roundPixelsBitGl",
    ()=>roundPixelsBitGl
]);
"use strict";
const roundPixelsBit = {
    name: "round-pixels-bit",
    vertex: {
        header: "\n            fn roundPixels(position: vec2<f32>, targetSize: vec2<f32>) -> vec2<f32>\n            {\n                return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;\n            }\n        "
    }
};
const roundPixelsBitGl = {
    name: "round-pixels-bit",
    vertex: {
        header: "\n            vec2 roundPixels(vec2 position, vec2 targetSize)\n            {\n                return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;\n            }\n        "
    }
};
;
 //# sourceMappingURL=roundPixelsBit.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/types.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UNIFORM_TYPES_MAP",
    ()=>UNIFORM_TYPES_MAP,
    "UNIFORM_TYPES_VALUES",
    ()=>UNIFORM_TYPES_VALUES
]);
"use strict";
const UNIFORM_TYPES_VALUES = [
    "f32",
    "i32",
    "vec2<f32>",
    "vec3<f32>",
    "vec4<f32>",
    "mat2x2<f32>",
    "mat3x3<f32>",
    "mat4x4<f32>",
    "mat3x2<f32>",
    "mat4x2<f32>",
    "mat2x3<f32>",
    "mat4x3<f32>",
    "mat2x4<f32>",
    "mat3x4<f32>",
    "vec2<i32>",
    "vec3<i32>",
    "vec4<i32>"
];
const UNIFORM_TYPES_MAP = UNIFORM_TYPES_VALUES.reduce((acc, type)=>{
    acc[type] = true;
    return acc;
}, {});
;
 //# sourceMappingURL=types.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/getDefaultUniformValue.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDefaultUniformValue",
    ()=>getDefaultUniformValue
]);
"use strict";
function getDefaultUniformValue(type, size) {
    switch(type){
        case "f32":
            return 0;
        case "vec2<f32>":
            return new Float32Array(2 * size);
        case "vec3<f32>":
            return new Float32Array(3 * size);
        case "vec4<f32>":
            return new Float32Array(4 * size);
        case "mat2x2<f32>":
            return new Float32Array([
                1,
                0,
                0,
                1
            ]);
        case "mat3x3<f32>":
            return new Float32Array([
                1,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                1
            ]);
        case "mat4x4<f32>":
            return new Float32Array([
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1
            ]);
    }
    return null;
}
;
 //# sourceMappingURL=getDefaultUniformValue.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UniformGroup",
    ()=>UniformGroup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$utils$2f$createIdFromString$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/utils/createIdFromString.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$types$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/types.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$getDefaultUniformValue$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/getDefaultUniformValue.mjs [app-client] (ecmascript)");
;
;
;
;
"use strict";
const _UniformGroup = class _UniformGroup {
    /** Call this if you want the uniform groups data to be uploaded to the GPU only useful if `isStatic` is true. */ update() {
        this._dirtyId++;
    }
    /**
   * Create a new Uniform group
   * @param uniformStructures - The structures of the uniform group
   * @param options - The optional parameters of this uniform group
   */ constructor(uniformStructures, options){
        /**
     * used internally to know if a uniform group was used in the last render pass
     * @internal
     */ this._touched = 0;
        /** a unique id for this uniform group used through the renderer */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("uniform");
        /**
     * a resource type, used to identify how to handle it when its in a bind group / shader resource
     * @internal
     */ this._resourceType = "uniformGroup";
        /**
     * the resource id used internally by the renderer to build bind group keys
     * @internal
     */ this._resourceId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("resource");
        /** used ito identify if this is a uniform group */ this.isUniformGroup = true;
        /**
     * used to flag if this Uniform groups data is different from what it has stored in its buffer / on the GPU
     * @internal
     */ this._dirtyId = 0;
        // implementing the interface - UniformGroup are not destroyed
        this.destroyed = false;
        options = {
            ..._UniformGroup.defaultOptions,
            ...options
        };
        this.uniformStructures = uniformStructures;
        const uniforms = {};
        for(const i in uniformStructures){
            const uniformData = uniformStructures[i];
            uniformData.name = i;
            var _uniformData_size;
            uniformData.size = (_uniformData_size = uniformData.size) !== null && _uniformData_size !== void 0 ? _uniformData_size : 1;
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$types$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UNIFORM_TYPES_MAP"][uniformData.type]) {
                const arrayMatch = uniformData.type.match(/^array<(\w+(?:<\w+>)?),\s*(\d+)>$/);
                if (arrayMatch) {
                    const [, innerType, size] = arrayMatch;
                    throw new Error("Uniform type ".concat(uniformData.type, " is not supported. Use type: '").concat(innerType, "', size: ").concat(size, " instead."));
                }
                throw new Error("Uniform type ".concat(uniformData.type, " is not supported. Supported uniform types are: ").concat(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$types$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UNIFORM_TYPES_VALUES"].join(", ")));
            }
            var _uniformData_value;
            (_uniformData_value = uniformData.value) !== null && _uniformData_value !== void 0 ? _uniformData_value : uniformData.value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$getDefaultUniformValue$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultUniformValue"])(uniformData.type, uniformData.size);
            uniforms[i] = uniformData.value;
        }
        this.uniforms = uniforms;
        this._dirtyId = 1;
        this.ubo = options.ubo;
        this.isStatic = options.isStatic;
        this._signature = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$utils$2f$createIdFromString$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createIdFromString"])(Object.keys(uniforms).map((i)=>"".concat(i, "-").concat(uniformStructures[i].type)).join("-"), "uniform-group");
    }
};
/** The default options used by the uniform group. */ _UniformGroup.defaultOptions = {
    /** if true the UniformGroup is handled as an Uniform buffer object. */ ubo: false,
    /** if true, then you are responsible for when the data is uploaded to the GPU by calling `update()` */ isStatic: false
};
let UniformGroup = _UniformGroup;
;
 //# sourceMappingURL=UniformGroup.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/getBatchSamplersUniformGroup.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBatchSamplersUniformGroup",
    ()=>getBatchSamplersUniformGroup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-client] (ecmascript)");
;
"use strict";
const batchSamplersUniformGroupHash = {};
function getBatchSamplersUniformGroup(maxTextures) {
    let batchSamplersUniformGroup = batchSamplersUniformGroupHash[maxTextures];
    if (batchSamplersUniformGroup) return batchSamplersUniformGroup;
    const sampleValues = new Int32Array(maxTextures);
    for(let i = 0; i < maxTextures; i++){
        sampleValues[i] = i;
    }
    batchSamplersUniformGroup = batchSamplersUniformGroupHash[maxTextures] = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UniformGroup"]({
        uTextures: {
            value: sampleValues,
            type: "i32",
            size: maxTextures
        }
    }, {
        isStatic: true
    });
    return batchSamplersUniformGroup;
}
;
 //# sourceMappingURL=getBatchSamplersUniformGroup.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RendererType",
    ()=>RendererType
]);
"use strict";
var RendererType = /* @__PURE__ */ ((RendererType2)=>{
    RendererType2[RendererType2["WEBGL"] = 1] = "WEBGL";
    RendererType2[RendererType2["WEBGPU"] = 2] = "WEBGPU";
    RendererType2[RendererType2["BOTH"] = 3] = "BOTH";
    return RendererType2;
})(RendererType || {});
;
 //# sourceMappingURL=types.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Shader",
    ()=>Shader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgram.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/BindGroup.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuProgram.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
class Shader extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    /**
   * Sometimes a resource group will be provided later (for example global uniforms)
   * In such cases, this method can be used to let the shader know about the group.
   * @param name - the name of the resource group
   * @param groupIndex - the index of the group (should match the webGPU shader group location)
   * @param bindIndex - the index of the bind point (should match the webGPU shader bind point)
   */ addResource(name, groupIndex, bindIndex) {
        var _a, _b;
        (_a = this._uniformBindMap)[groupIndex] || (_a[groupIndex] = {});
        (_b = this._uniformBindMap[groupIndex])[bindIndex] || (_b[bindIndex] = name);
        if (!this.groups[groupIndex]) {
            this.groups[groupIndex] = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BindGroup"]();
            this._ownedBindGroups.push(this.groups[groupIndex]);
        }
    }
    _buildResourceAccessor(groups, nameHash) {
        const uniformsOut = {};
        for(const i in nameHash){
            const data = nameHash[i];
            Object.defineProperty(uniformsOut, data.name, {
                get () {
                    return groups[data.group].getResource(data.binding);
                },
                set (value) {
                    groups[data.group].setResource(value, data.binding);
                }
            });
        }
        return uniformsOut;
    }
    /**
   * Use to destroy the shader when its not longer needed.
   * It will destroy the resources and remove listeners.
   * @param destroyPrograms - if the programs should be destroyed as well.
   * Make sure its not being used by other shaders!
   */ destroy() {
        let destroyPrograms = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        this.emit("destroy", this);
        if (destroyPrograms) {
            var _this_gpuProgram, _this_glProgram;
            (_this_gpuProgram = this.gpuProgram) === null || _this_gpuProgram === void 0 ? void 0 : _this_gpuProgram.destroy();
            (_this_glProgram = this.glProgram) === null || _this_glProgram === void 0 ? void 0 : _this_glProgram.destroy();
        }
        this.gpuProgram = null;
        this.glProgram = null;
        this.removeAllListeners();
        this._uniformBindMap = null;
        this._ownedBindGroups.forEach((bindGroup)=>{
            bindGroup.destroy();
        });
        this._ownedBindGroups = null;
        this.resources = null;
        this.groups = null;
    }
    static from(options) {
        const { gpu, gl, ...rest } = options;
        let gpuProgram;
        let glProgram;
        if (gpu) {
            gpuProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GpuProgram"].from(gpu);
        }
        if (gl) {
            glProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GlProgram"].from(gl);
        }
        return new Shader({
            gpuProgram,
            glProgram,
            ...rest
        });
    }
    constructor(options){
        super();
        /** A unique identifier for the shader */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("shader");
        /**
     * A record of the uniform groups and resources used by the shader.
     * This is used by WebGL renderer to sync uniform data.
     * @internal
     */ this._uniformBindMap = /* @__PURE__ */ Object.create(null);
        this._ownedBindGroups = [];
        let { gpuProgram, glProgram, groups, resources, compatibleRenderers, groupMap } = options;
        this.gpuProgram = gpuProgram;
        this.glProgram = glProgram;
        if (compatibleRenderers === void 0) {
            compatibleRenderers = 0;
            if (gpuProgram) compatibleRenderers |= __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RendererType"].WEBGPU;
            if (glProgram) compatibleRenderers |= __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RendererType"].WEBGL;
        }
        this.compatibleRenderers = compatibleRenderers;
        const nameHash = {};
        if (!resources && !groups) {
            resources = {};
        }
        if (resources && groups) {
            throw new Error("[Shader] Cannot have both resources and groups");
        } else if (!gpuProgram && groups && !groupMap) {
            throw new Error("[Shader] No group map or WebGPU shader provided - consider using resources instead.");
        } else if (!gpuProgram && groups && groupMap) {
            for(const i in groupMap){
                for(const j in groupMap[i]){
                    const uniformName = groupMap[i][j];
                    nameHash[uniformName] = {
                        group: i,
                        binding: j,
                        name: uniformName
                    };
                }
            }
        } else if (gpuProgram && groups && !groupMap) {
            const groupData = gpuProgram.structsAndGroups.groups;
            groupMap = {};
            groupData.forEach((data)=>{
                groupMap[data.group] = groupMap[data.group] || {};
                groupMap[data.group][data.binding] = data.name;
                nameHash[data.name] = data;
            });
        } else if (resources) {
            groups = {};
            groupMap = {};
            if (gpuProgram) {
                const groupData = gpuProgram.structsAndGroups.groups;
                groupData.forEach((data)=>{
                    groupMap[data.group] = groupMap[data.group] || {};
                    groupMap[data.group][data.binding] = data.name;
                    nameHash[data.name] = data;
                });
            }
            let bindTick = 0;
            for(const i in resources){
                if (nameHash[i]) continue;
                if (!groups[99]) {
                    groups[99] = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BindGroup"]();
                    this._ownedBindGroups.push(groups[99]);
                }
                nameHash[i] = {
                    group: 99,
                    binding: bindTick,
                    name: i
                };
                groupMap[99] = groupMap[99] || {};
                groupMap[99][bindTick] = i;
                bindTick++;
            }
            for(const i in resources){
                const name = i;
                let value = resources[i];
                if (!value.source && !value._resourceType) {
                    value = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UniformGroup"](value);
                }
                const data = nameHash[name];
                if (data) {
                    if (!groups[data.group]) {
                        groups[data.group] = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BindGroup"]();
                        this._ownedBindGroups.push(groups[data.group]);
                    }
                    groups[data.group].setResource(value, data.binding);
                }
            }
        }
        this.groups = groups;
        this._uniformBindMap = groupMap;
        this.resources = this._buildResourceAccessor(groups, nameHash);
    }
}
;
 //# sourceMappingURL=Shader.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/DefaultShader.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DefaultShader",
    ()=>DefaultShader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compileHighShaderToProgram.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$colorBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/colorBit.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$generateTextureBatchBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/generateTextureBatchBit.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/roundPixelsBit.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$getBatchSamplersUniformGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/getBatchSamplersUniformGroup.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
"use strict";
class DefaultShader extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Shader"] {
    constructor(maxTextures){
        const glProgram = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compileHighShaderGlProgram"])({
            name: "batch",
            bits: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$colorBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["colorBitGl"],
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$generateTextureBatchBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateTextureBatchBitGl"])(maxTextures),
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["roundPixelsBitGl"]
            ]
        });
        const gpuProgram = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compileHighShaderGpuProgram"])({
            name: "batch",
            bits: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$colorBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["colorBit"],
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$generateTextureBatchBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateTextureBatchBit"])(maxTextures),
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["roundPixelsBit"]
            ]
        });
        super({
            glProgram,
            gpuProgram,
            resources: {
                batchSamplers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$getBatchSamplersUniformGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBatchSamplersUniformGroup"])(maxTextures)
            }
        });
    }
}
;
 //# sourceMappingURL=DefaultShader.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/DefaultBatcher.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DefaultBatcher",
    ()=>DefaultBatcher
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$Batcher$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/Batcher.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$BatchGeometry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/BatchGeometry.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$DefaultShader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/DefaultShader.mjs [app-client] (ecmascript)");
;
;
;
;
"use strict";
let defaultShader = null;
const _DefaultBatcher = class _DefaultBatcher extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$Batcher$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Batcher"] {
    /**
   * Packs the attributes of a DefaultBatchableMeshElement into the provided views.
   * @param element - The DefaultBatchableMeshElement to pack.
   * @param float32View - The Float32Array view to pack into.
   * @param uint32View - The Uint32Array view to pack into.
   * @param index - The starting index in the views.
   * @param textureId - The texture ID to use.
   */ packAttributes(element, float32View, uint32View, index, textureId) {
        const textureIdAndRound = textureId << 16 | element.roundPixels & 65535;
        const wt = element.transform;
        const a = wt.a;
        const b = wt.b;
        const c = wt.c;
        const d = wt.d;
        const tx = wt.tx;
        const ty = wt.ty;
        const { positions, uvs } = element;
        const argb = element.color;
        const offset = element.attributeOffset;
        const end = offset + element.attributeSize;
        for(let i = offset; i < end; i++){
            const i2 = i * 2;
            const x = positions[i2];
            const y = positions[i2 + 1];
            float32View[index++] = a * x + c * y + tx;
            float32View[index++] = d * y + b * x + ty;
            float32View[index++] = uvs[i2];
            float32View[index++] = uvs[i2 + 1];
            uint32View[index++] = argb;
            uint32View[index++] = textureIdAndRound;
        }
    }
    /**
   * Packs the attributes of a DefaultBatchableQuadElement into the provided views.
   * @param element - The DefaultBatchableQuadElement to pack.
   * @param float32View - The Float32Array view to pack into.
   * @param uint32View - The Uint32Array view to pack into.
   * @param index - The starting index in the views.
   * @param textureId - The texture ID to use.
   */ packQuadAttributes(element, float32View, uint32View, index, textureId) {
        const texture = element.texture;
        const wt = element.transform;
        const a = wt.a;
        const b = wt.b;
        const c = wt.c;
        const d = wt.d;
        const tx = wt.tx;
        const ty = wt.ty;
        const bounds = element.bounds;
        const w0 = bounds.maxX;
        const w1 = bounds.minX;
        const h0 = bounds.maxY;
        const h1 = bounds.minY;
        const uvs = texture.uvs;
        const argb = element.color;
        const textureIdAndRound = textureId << 16 | element.roundPixels & 65535;
        float32View[index + 0] = a * w1 + c * h1 + tx;
        float32View[index + 1] = d * h1 + b * w1 + ty;
        float32View[index + 2] = uvs.x0;
        float32View[index + 3] = uvs.y0;
        uint32View[index + 4] = argb;
        uint32View[index + 5] = textureIdAndRound;
        float32View[index + 6] = a * w0 + c * h1 + tx;
        float32View[index + 7] = d * h1 + b * w0 + ty;
        float32View[index + 8] = uvs.x1;
        float32View[index + 9] = uvs.y1;
        uint32View[index + 10] = argb;
        uint32View[index + 11] = textureIdAndRound;
        float32View[index + 12] = a * w0 + c * h0 + tx;
        float32View[index + 13] = d * h0 + b * w0 + ty;
        float32View[index + 14] = uvs.x2;
        float32View[index + 15] = uvs.y2;
        uint32View[index + 16] = argb;
        uint32View[index + 17] = textureIdAndRound;
        float32View[index + 18] = a * w1 + c * h0 + tx;
        float32View[index + 19] = d * h0 + b * w1 + ty;
        float32View[index + 20] = uvs.x3;
        float32View[index + 21] = uvs.y3;
        uint32View[index + 22] = argb;
        uint32View[index + 23] = textureIdAndRound;
    }
    constructor(options){
        super(options);
        this.geometry = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$BatchGeometry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BatchGeometry"]();
        this.name = _DefaultBatcher.extension.name;
        /** The size of one attribute. 1 = 32 bit. x, y, u, v, color, textureIdAndRound -> total = 6 */ this.vertexSize = 6;
        defaultShader !== null && defaultShader !== void 0 ? defaultShader : defaultShader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$DefaultShader$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultShader"](options.maxTextures);
        this.shader = defaultShader;
    }
};
/** @ignore */ _DefaultBatcher.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].Batcher
    ],
    name: "default"
};
let DefaultBatcher = _DefaultBatcher;
;
 //# sourceMappingURL=DefaultBatcher.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/buildUvs.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildSimpleUvs",
    ()=>buildSimpleUvs,
    "buildUvs",
    ()=>buildUvs
]);
"use strict";
function buildUvs(vertices, verticesStride, verticesOffset, uvs, uvsOffset, uvsStride, size) {
    let matrix = arguments.length > 7 && arguments[7] !== void 0 ? arguments[7] : null;
    let index = 0;
    verticesOffset *= verticesStride;
    uvsOffset *= uvsStride;
    const a = matrix.a;
    const b = matrix.b;
    const c = matrix.c;
    const d = matrix.d;
    const tx = matrix.tx;
    const ty = matrix.ty;
    while(index < size){
        const x = vertices[verticesOffset];
        const y = vertices[verticesOffset + 1];
        uvs[uvsOffset] = a * x + c * y + tx;
        uvs[uvsOffset + 1] = b * x + d * y + ty;
        uvsOffset += uvsStride;
        verticesOffset += verticesStride;
        index++;
    }
}
function buildSimpleUvs(uvs, uvsOffset, uvsStride, size) {
    let index = 0;
    uvsOffset *= uvsStride;
    while(index < size){
        uvs[uvsOffset] = 0;
        uvs[uvsOffset + 1] = 0;
        uvsOffset += uvsStride;
        index++;
    }
}
;
 //# sourceMappingURL=buildUvs.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/transformVertices.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "transformVertices",
    ()=>transformVertices
]);
"use strict";
function transformVertices(vertices, m, offset, stride, size) {
    const a = m.a;
    const b = m.b;
    const c = m.c;
    const d = m.d;
    const tx = m.tx;
    const ty = m.ty;
    offset || (offset = 0);
    stride || (stride = 2);
    size || (size = vertices.length / stride - offset);
    let index = offset * stride;
    for(let i = 0; i < size; i++){
        const x = vertices[index];
        const y = vertices[index + 1];
        vertices[index] = a * x + c * y + tx;
        vertices[index + 1] = b * x + d * y + ty;
        index += stride;
    }
}
;
 //# sourceMappingURL=transformVertices.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/CanvasPool.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CanvasPool",
    ()=>CanvasPool,
    "CanvasPoolClass",
    ()=>CanvasPoolClass
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/misc/pow2.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/GlobalResourceRegistry.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
class CanvasPoolClass {
    /**
   * Creates texture with params that were specified in pool constructor.
   * @param pixelWidth - Width of texture in pixels.
   * @param pixelHeight - Height of texture in pixels.
   */ _createCanvasAndContext(pixelWidth, pixelHeight) {
        const canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas();
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        const context = canvas.getContext("2d");
        return {
            canvas,
            context
        };
    }
    /**
   * Gets a Power-of-Two render texture or fullScreen texture
   * @param minWidth - The minimum width of the render texture.
   * @param minHeight - The minimum height of the render texture.
   * @param resolution - The resolution of the render texture.
   * @returns The new render texture.
   */ getOptimalCanvasAndContext(minWidth, minHeight) {
        let resolution = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
        minWidth = Math.ceil(minWidth * resolution - 1e-6);
        minHeight = Math.ceil(minHeight * resolution - 1e-6);
        minWidth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nextPow2"])(minWidth);
        minHeight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nextPow2"])(minHeight);
        const key = (minWidth << 17) + (minHeight << 1);
        if (!this._canvasPool[key]) {
            this._canvasPool[key] = [];
        }
        let canvasAndContext = this._canvasPool[key].pop();
        if (!canvasAndContext) {
            canvasAndContext = this._createCanvasAndContext(minWidth, minHeight);
        }
        return canvasAndContext;
    }
    /**
   * Place a render texture back into the pool.
   * @param canvasAndContext
   */ returnCanvasAndContext(canvasAndContext) {
        const canvas = canvasAndContext.canvas;
        const { width, height } = canvas;
        const key = (width << 17) + (height << 1);
        canvasAndContext.context.resetTransform();
        canvasAndContext.context.clearRect(0, 0, width, height);
        this._canvasPool[key].push(canvasAndContext);
    }
    clear() {
        this._canvasPool = {};
    }
    constructor(canvasOptions){
        this._canvasPool = /* @__PURE__ */ Object.create(null);
        this.canvasOptions = canvasOptions || {};
        this.enableFullScreen = false;
    }
}
const CanvasPool = new CanvasPoolClass();
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GlobalResourceRegistry"].register(CanvasPool);
;
 //# sourceMappingURL=CanvasPool.mjs.map
}),
]);

//# sourceMappingURL=5703a_pixi_js_lib_rendering_95f5a678._.js.map