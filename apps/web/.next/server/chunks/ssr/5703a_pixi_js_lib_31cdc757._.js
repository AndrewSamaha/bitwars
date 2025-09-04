module.exports = [
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/app/ResizePlugin.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ResizePlugin",
    ()=>ResizePlugin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class ResizePlugin {
    /**
   * Initialize the plugin with scope of application instance
   * @private
   * @param {object} [options] - See application options
   */ static init(options) {
        Object.defineProperty(this, "resizeTo", {
            set (dom) {
                globalThis.removeEventListener("resize", this.queueResize);
                this._resizeTo = dom;
                if (dom) {
                    globalThis.addEventListener("resize", this.queueResize);
                    this.resize();
                }
            },
            get () {
                return this._resizeTo;
            }
        });
        this.queueResize = ()=>{
            if (!this._resizeTo) {
                return;
            }
            this._cancelResize();
            this._resizeId = requestAnimationFrame(()=>this.resize());
        };
        this._cancelResize = ()=>{
            if (this._resizeId) {
                cancelAnimationFrame(this._resizeId);
                this._resizeId = null;
            }
        };
        this.resize = ()=>{
            if (!this._resizeTo) {
                return;
            }
            this._cancelResize();
            let width;
            let height;
            if (this._resizeTo === globalThis.window) {
                width = globalThis.innerWidth;
                height = globalThis.innerHeight;
            } else {
                const { clientWidth, clientHeight } = this._resizeTo;
                width = clientWidth;
                height = clientHeight;
            }
            this.renderer.resize(width, height);
            this.render();
        };
        this._resizeId = null;
        this._resizeTo = null;
        this.resizeTo = options.resizeTo || null;
    }
    /**
   * Clean up the ticker, scoped to application
   * @private
   */ static destroy() {
        globalThis.removeEventListener("resize", this.queueResize);
        this._cancelResize();
        this._cancelResize = null;
        this.queueResize = null;
        this.resizeTo = null;
        this.resize = null;
    }
}
/** @ignore */ ResizePlugin.extension = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].Application;
;
 //# sourceMappingURL=ResizePlugin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/app/TickerPlugin.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TickerPlugin",
    ()=>TickerPlugin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/ticker/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/ticker/Ticker.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class TickerPlugin {
    /**
   * Initialize the plugin with scope of application instance
   * @private
   * @param {object} [options] - See application options
   */ static init(options) {
        options = Object.assign({
            autoStart: true,
            sharedTicker: false
        }, options);
        Object.defineProperty(this, "ticker", {
            set (ticker) {
                if (this._ticker) {
                    this._ticker.remove(this.render, this);
                }
                this._ticker = ticker;
                if (ticker) {
                    ticker.add(this.render, this, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_PRIORITY"].LOW);
                }
            },
            get () {
                return this._ticker;
            }
        });
        this.stop = ()=>{
            this._ticker.stop();
        };
        this.start = ()=>{
            this._ticker.start();
        };
        this._ticker = null;
        this.ticker = options.sharedTicker ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Ticker"].shared : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Ticker"]();
        if (options.autoStart) {
            this.start();
        }
    }
    /**
   * Clean up the ticker, scoped to application.
   * @private
   */ static destroy() {
        if (this._ticker) {
            const oldTicker = this._ticker;
            this.ticker = null;
            oldTicker.destroy();
        }
    }
}
/** @ignore */ TickerPlugin.extension = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].Application;
;
 //# sourceMappingURL=TickerPlugin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/app/init.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$app$2f$ResizePlugin$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/app/ResizePlugin.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$app$2f$TickerPlugin$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/app/TickerPlugin.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$app$2f$ResizePlugin$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ResizePlugin"]);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$app$2f$TickerPlugin$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TickerPlugin"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "State",
    ()=>State
]);
"use strict";
const blendModeIds = {
    normal: 0,
    add: 1,
    multiply: 2,
    screen: 3,
    overlay: 4,
    erase: 5,
    "normal-npm": 6,
    "add-npm": 7,
    "screen-npm": 8,
    min: 9,
    max: 10
};
const BLEND = 0;
const OFFSET = 1;
const CULLING = 2;
const DEPTH_TEST = 3;
const WINDING = 4;
const DEPTH_MASK = 5;
const _State = class _State {
    constructor(){
        this.data = 0;
        this.blendMode = "normal";
        this.polygonOffset = 0;
        this.blend = true;
        this.depthMask = true;
    }
    /**
   * Activates blending of the computed fragment color values.
   * @default true
   */ get blend() {
        return !!(this.data & 1 << BLEND);
    }
    set blend(value) {
        if (!!(this.data & 1 << BLEND) !== value) {
            this.data ^= 1 << BLEND;
        }
    }
    /**
   * Activates adding an offset to depth values of polygon's fragments
   * @default false
   */ get offsets() {
        return !!(this.data & 1 << OFFSET);
    }
    set offsets(value) {
        if (!!(this.data & 1 << OFFSET) !== value) {
            this.data ^= 1 << OFFSET;
        }
    }
    /** The culling settings for this state none - No culling back - Back face culling front - Front face culling */ set cullMode(value) {
        if (value === "none") {
            this.culling = false;
            return;
        }
        this.culling = true;
        this.clockwiseFrontFace = value === "front";
    }
    get cullMode() {
        if (!this.culling) {
            return "none";
        }
        return this.clockwiseFrontFace ? "front" : "back";
    }
    /**
   * Activates culling of polygons.
   * @default false
   */ get culling() {
        return !!(this.data & 1 << CULLING);
    }
    set culling(value) {
        if (!!(this.data & 1 << CULLING) !== value) {
            this.data ^= 1 << CULLING;
        }
    }
    /**
   * Activates depth comparisons and updates to the depth buffer.
   * @default false
   */ get depthTest() {
        return !!(this.data & 1 << DEPTH_TEST);
    }
    set depthTest(value) {
        if (!!(this.data & 1 << DEPTH_TEST) !== value) {
            this.data ^= 1 << DEPTH_TEST;
        }
    }
    /**
   * Enables or disables writing to the depth buffer.
   * @default true
   */ get depthMask() {
        return !!(this.data & 1 << DEPTH_MASK);
    }
    set depthMask(value) {
        if (!!(this.data & 1 << DEPTH_MASK) !== value) {
            this.data ^= 1 << DEPTH_MASK;
        }
    }
    /**
   * Specifies whether or not front or back-facing polygons can be culled.
   * @default false
   */ get clockwiseFrontFace() {
        return !!(this.data & 1 << WINDING);
    }
    set clockwiseFrontFace(value) {
        if (!!(this.data & 1 << WINDING) !== value) {
            this.data ^= 1 << WINDING;
        }
    }
    /**
   * The blend mode to be applied when this state is set. Apply a value of `normal` to reset the blend mode.
   * Setting this mode to anything other than NO_BLEND will automatically switch blending on.
   * @default 'normal'
   */ get blendMode() {
        return this._blendMode;
    }
    set blendMode(value) {
        this.blend = value !== "none";
        this._blendMode = value;
        this._blendModeId = blendModeIds[value] || 0;
    }
    /**
   * The polygon offset. Setting this property to anything other than 0 will automatically enable polygon offset fill.
   * @default 0
   */ get polygonOffset() {
        return this._polygonOffset;
    }
    set polygonOffset(value) {
        this.offsets = !!value;
        this._polygonOffset = value;
    }
    toString() {
        return `[pixi.js/core:State blendMode=${this.blendMode} clockwiseFrontFace=${this.clockwiseFrontFace} culling=${this.culling} depthMask=${this.depthMask} polygonOffset=${this.polygonOffset}]`;
    }
    /**
   * A quickly getting an instance of a State that is configured for 2d rendering.
   * @returns a new State with values set for 2d rendering
   */ static for2d() {
        const state = new _State();
        state.depthTest = false;
        state.blend = true;
        return state;
    }
};
_State.default2d = _State.for2d();
let State = _State;
;
 //# sourceMappingURL=State.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gpu/colorToUniform.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "color32BitToUniform",
    ()=>color32BitToUniform,
    "colorToUniform",
    ()=>colorToUniform
]);
"use strict";
function colorToUniform(rgb, alpha, out, offset) {
    out[offset++] = (rgb >> 16 & 255) / 255;
    out[offset++] = (rgb >> 8 & 255) / 255;
    out[offset++] = (rgb & 255) / 255;
    out[offset++] = alpha;
}
function color32BitToUniform(abgr, out, offset) {
    const alpha = (abgr >> 24 & 255) / 255;
    out[offset++] = (abgr & 255) / 255 * alpha;
    out[offset++] = (abgr >> 8 & 255) / 255 * alpha;
    out[offset++] = (abgr >> 16 & 255) / 255 * alpha;
    out[offset++] = alpha;
}
;
 //# sourceMappingURL=colorToUniform.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/GraphicsPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GraphicsGpuData",
    ()=>GraphicsGpuData,
    "GraphicsPipe",
    ()=>GraphicsPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gpu/colorToUniform.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$BatchableGraphics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/BatchableGraphics.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
"use strict";
class GraphicsGpuData {
    constructor(){
        this.batches = [];
        this.batched = false;
    }
    destroy() {
        this.batches.forEach((batch)=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].return(batch);
        });
        this.batches.length = 0;
    }
}
class GraphicsPipe {
    constructor(renderer, adaptor){
        this.state = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].for2d();
        this.renderer = renderer;
        this._adaptor = adaptor;
        this.renderer.runners.contextChange.add(this);
    }
    contextChange() {
        this._adaptor.contextChange(this.renderer);
    }
    validateRenderable(graphics) {
        const context = graphics.context;
        const wasBatched = !!graphics._gpuData;
        const gpuContext = this.renderer.graphicsContext.updateGpuContext(context);
        if (gpuContext.isBatchable || wasBatched !== gpuContext.isBatchable) {
            return true;
        }
        return false;
    }
    addRenderable(graphics, instructionSet) {
        const gpuContext = this.renderer.graphicsContext.updateGpuContext(graphics.context);
        if (graphics.didViewUpdate) {
            this._rebuild(graphics);
        }
        if (gpuContext.isBatchable) {
            this._addToBatcher(graphics, instructionSet);
        } else {
            this.renderer.renderPipes.batch.break(instructionSet);
            instructionSet.add(graphics);
        }
    }
    updateRenderable(graphics) {
        const gpuData = this._getGpuDataForRenderable(graphics);
        const batches = gpuData.batches;
        for(let i = 0; i < batches.length; i++){
            const batch = batches[i];
            batch._batcher.updateElement(batch);
        }
    }
    execute(graphics) {
        if (!graphics.isRenderable) return;
        const renderer = this.renderer;
        const context = graphics.context;
        const contextSystem = renderer.graphicsContext;
        if (!contextSystem.getGpuContext(context).batches.length) {
            return;
        }
        const shader = context.customShader || this._adaptor.shader;
        this.state.blendMode = graphics.groupBlendMode;
        const localUniforms = shader.resources.localUniforms.uniforms;
        localUniforms.uTransformMatrix = graphics.groupTransform;
        localUniforms.uRound = renderer._roundPixels | graphics._roundPixels;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["color32BitToUniform"])(graphics.groupColorAlpha, localUniforms.uColor, 0);
        this._adaptor.execute(this, graphics);
    }
    _rebuild(graphics) {
        const gpuData = this._getGpuDataForRenderable(graphics);
        const gpuContext = this.renderer.graphicsContext.updateGpuContext(graphics.context);
        gpuData.destroy();
        if (gpuContext.isBatchable) {
            this._updateBatchesForRenderable(graphics, gpuData);
        }
    }
    _addToBatcher(graphics, instructionSet) {
        const batchPipe = this.renderer.renderPipes.batch;
        const batches = this._getGpuDataForRenderable(graphics).batches;
        for(let i = 0; i < batches.length; i++){
            const batch = batches[i];
            batchPipe.addToBatch(batch, instructionSet);
        }
    }
    _getGpuDataForRenderable(graphics) {
        return graphics._gpuData[this.renderer.uid] || this._initGpuDataForRenderable(graphics);
    }
    _initGpuDataForRenderable(graphics) {
        const gpuData = new GraphicsGpuData();
        graphics._gpuData[this.renderer.uid] = gpuData;
        return gpuData;
    }
    _updateBatchesForRenderable(graphics, gpuData) {
        const context = graphics.context;
        const gpuContext = this.renderer.graphicsContext.getGpuContext(context);
        const roundPixels = this.renderer._roundPixels | graphics._roundPixels;
        gpuData.batches = gpuContext.batches.map((batch)=>{
            const batchClone = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].get(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$BatchableGraphics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableGraphics"]);
            batch.copyTo(batchClone);
            batchClone.renderable = graphics;
            batchClone.roundPixels = roundPixels;
            return batchClone;
        });
    }
    destroy() {
        this.renderer = null;
        this._adaptor.destroy();
        this._adaptor = null;
        this.state = null;
    }
}
/** @ignore */ GraphicsPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "graphics"
};
;
 //# sourceMappingURL=GraphicsPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/init.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContextSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/GraphicsContextSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/GraphicsPipe.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GraphicsPipe"]);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContextSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GraphicsContextSystem"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/shared/BatchableMesh.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchableMesh",
    ()=>BatchableMesh
]);
"use strict";
class BatchableMesh {
    constructor(){
        this.batcherName = "default";
        this.packAsQuad = false;
        this.indexOffset = 0;
        this.attributeOffset = 0;
        this.roundPixels = 0;
        this._batcher = null;
        this._batch = null;
        this._textureMatrixUpdateId = -1;
        this._uvUpdateId = -1;
    }
    get blendMode() {
        return this.renderable.groupBlendMode;
    }
    get topology() {
        return this._topology || this.geometry.topology;
    }
    set topology(value) {
        this._topology = value;
    }
    reset() {
        this.renderable = null;
        this.texture = null;
        this._batcher = null;
        this._batch = null;
        this.geometry = null;
        this._uvUpdateId = -1;
        this._textureMatrixUpdateId = -1;
    }
    /**
   * Sets the texture for the batchable mesh.
   * As it does so, it resets the texture matrix update ID.
   * this is to ensure that the texture matrix is recalculated when the uvs are referenced
   * @param value - The texture to set.
   */ setTexture(value) {
        if (this.texture === value) return;
        this.texture = value;
        this._textureMatrixUpdateId = -1;
    }
    get uvs() {
        const geometry = this.geometry;
        const uvBuffer = geometry.getBuffer("aUV");
        const uvs = uvBuffer.data;
        let transformedUvs = uvs;
        const textureMatrix = this.texture.textureMatrix;
        if (!textureMatrix.isSimple) {
            transformedUvs = this._transformedUvs;
            if (this._textureMatrixUpdateId !== textureMatrix._updateID || this._uvUpdateId !== uvBuffer._updateID) {
                if (!transformedUvs || transformedUvs.length < uvs.length) {
                    transformedUvs = this._transformedUvs = new Float32Array(uvs.length);
                }
                this._textureMatrixUpdateId = textureMatrix._updateID;
                this._uvUpdateId = uvBuffer._updateID;
                textureMatrix.multiplyUvs(uvs, transformedUvs);
            }
        }
        return transformedUvs;
    }
    get positions() {
        return this.geometry.positions;
    }
    get indices() {
        return this.geometry.indices;
    }
    get color() {
        return this.renderable.groupColorAlpha;
    }
    get groupTransform() {
        return this.renderable.groupTransform;
    }
    get attributeSize() {
        return this.geometry.positions.length / 2;
    }
    get indexSize() {
        return this.geometry.indices.length;
    }
}
;
 //# sourceMappingURL=BatchableMesh.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/shared/MeshPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MeshGpuData",
    ()=>MeshGpuData,
    "MeshPipe",
    ()=>MeshPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/BindGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$getAdjustedBlendModeBlend$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/getAdjustedBlendModeBlend.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gpu/colorToUniform.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$BatchableMesh$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/shared/BatchableMesh.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
class MeshGpuData {
    destroy() {}
}
class MeshPipe {
    constructor(renderer, adaptor){
        this.localUniforms = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
            uTransformMatrix: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            uColor: {
                value: new Float32Array([
                    1,
                    1,
                    1,
                    1
                ]),
                type: "vec4<f32>"
            },
            uRound: {
                value: 0,
                type: "f32"
            }
        });
        this.localUniformsBindGroup = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BindGroup"]({
            0: this.localUniforms
        });
        this.renderer = renderer;
        this._adaptor = adaptor;
        this._adaptor.init();
    }
    validateRenderable(mesh) {
        const meshData = this._getMeshData(mesh);
        const wasBatched = meshData.batched;
        const isBatched = mesh.batched;
        meshData.batched = isBatched;
        if (wasBatched !== isBatched) {
            return true;
        } else if (isBatched) {
            const geometry = mesh._geometry;
            if (geometry.indices.length !== meshData.indexSize || geometry.positions.length !== meshData.vertexSize) {
                meshData.indexSize = geometry.indices.length;
                meshData.vertexSize = geometry.positions.length;
                return true;
            }
            const batchableMesh = this._getBatchableMesh(mesh);
            if (batchableMesh.texture.uid !== mesh._texture.uid) {
                batchableMesh._textureMatrixUpdateId = -1;
            }
            return !batchableMesh._batcher.checkAndUpdateTexture(batchableMesh, mesh._texture);
        }
        return false;
    }
    addRenderable(mesh, instructionSet) {
        const batcher = this.renderer.renderPipes.batch;
        const meshData = this._getMeshData(mesh);
        if (mesh.didViewUpdate) {
            meshData.indexSize = mesh._geometry.indices?.length;
            meshData.vertexSize = mesh._geometry.positions?.length;
        }
        if (meshData.batched) {
            const gpuBatchableMesh = this._getBatchableMesh(mesh);
            gpuBatchableMesh.setTexture(mesh._texture);
            gpuBatchableMesh.geometry = mesh._geometry;
            batcher.addToBatch(gpuBatchableMesh, instructionSet);
        } else {
            batcher.break(instructionSet);
            instructionSet.add(mesh);
        }
    }
    updateRenderable(mesh) {
        if (mesh.batched) {
            const gpuBatchableMesh = this._getBatchableMesh(mesh);
            gpuBatchableMesh.setTexture(mesh._texture);
            gpuBatchableMesh.geometry = mesh._geometry;
            gpuBatchableMesh._batcher.updateElement(gpuBatchableMesh);
        }
    }
    execute(mesh) {
        if (!mesh.isRenderable) return;
        mesh.state.blendMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$getAdjustedBlendModeBlend$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAdjustedBlendModeBlend"])(mesh.groupBlendMode, mesh.texture._source);
        const localUniforms = this.localUniforms;
        localUniforms.uniforms.uTransformMatrix = mesh.groupTransform;
        localUniforms.uniforms.uRound = this.renderer._roundPixels | mesh._roundPixels;
        localUniforms.update();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["color32BitToUniform"])(mesh.groupColorAlpha, localUniforms.uniforms.uColor, 0);
        this._adaptor.execute(this, mesh);
    }
    _getMeshData(mesh) {
        var _a, _b;
        (_a = mesh._gpuData)[_b = this.renderer.uid] || (_a[_b] = new MeshGpuData());
        return mesh._gpuData[this.renderer.uid].meshData || this._initMeshData(mesh);
    }
    _initMeshData(mesh) {
        mesh._gpuData[this.renderer.uid].meshData = {
            batched: mesh.batched,
            indexSize: 0,
            vertexSize: 0
        };
        return mesh._gpuData[this.renderer.uid].meshData;
    }
    _getBatchableMesh(mesh) {
        var _a, _b;
        (_a = mesh._gpuData)[_b = this.renderer.uid] || (_a[_b] = new MeshGpuData());
        return mesh._gpuData[this.renderer.uid].batchableMesh || this._initBatchableMesh(mesh);
    }
    _initBatchableMesh(mesh) {
        const gpuMesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$BatchableMesh$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableMesh"]();
        gpuMesh.renderable = mesh;
        gpuMesh.setTexture(mesh._texture);
        gpuMesh.transform = mesh.groupTransform;
        gpuMesh.roundPixels = this.renderer._roundPixels | mesh._roundPixels;
        mesh._gpuData[this.renderer.uid].batchableMesh = gpuMesh;
        return gpuMesh;
    }
    destroy() {
        this.localUniforms = null;
        this.localUniformsBindGroup = null;
        this._adaptor.destroy();
        this._adaptor = null;
        this.renderer = null;
    }
}
/** @ignore */ MeshPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "mesh"
};
;
 //# sourceMappingURL=MeshPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/init.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$MeshPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/shared/MeshPipe.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$MeshPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshPipe"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/gl/GlParticleContainerAdaptor.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlParticleContainerAdaptor",
    ()=>GlParticleContainerAdaptor
]);
"use strict";
class GlParticleContainerAdaptor {
    execute(particleContainerPipe, container) {
        const state = particleContainerPipe.state;
        const renderer = particleContainerPipe.renderer;
        const shader = container.shader || particleContainerPipe.defaultShader;
        shader.resources.uTexture = container.texture._source;
        shader.resources.uniforms = particleContainerPipe.localUniforms;
        const gl = renderer.gl;
        const buffer = particleContainerPipe.getBuffers(container);
        renderer.shader.bind(shader);
        renderer.state.set(state);
        renderer.geometry.bind(buffer.geometry, shader.glProgram);
        const byteSize = buffer.geometry.indexBuffer.data.BYTES_PER_ELEMENT;
        const glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
        gl.drawElements(gl.TRIANGLES, container.particleChildren.length * 6, glType, 0);
    }
}
;
 //# sourceMappingURL=GlParticleContainerAdaptor.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/utils/createIndicesForQuads.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createIndicesForQuads",
    ()=>createIndicesForQuads
]);
"use strict";
function createIndicesForQuads(size, outBuffer = null) {
    const totalIndices = size * 6;
    if (totalIndices > 65535) {
        outBuffer || (outBuffer = new Uint32Array(totalIndices));
    } else {
        outBuffer || (outBuffer = new Uint16Array(totalIndices));
    }
    if (outBuffer.length !== totalIndices) {
        throw new Error(`Out buffer length is incorrect, got ${outBuffer.length} and expected ${totalIndices}`);
    }
    for(let i = 0, j = 0; i < totalIndices; i += 6, j += 4){
        outBuffer[i + 0] = j + 0;
        outBuffer[i + 1] = j + 1;
        outBuffer[i + 2] = j + 2;
        outBuffer[i + 3] = j + 0;
        outBuffer[i + 4] = j + 2;
        outBuffer[i + 5] = j + 3;
    }
    return outBuffer;
}
;
 //# sourceMappingURL=createIndicesForQuads.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/utils/generateParticleUpdateFunction.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateParticleUpdateFunction",
    ()=>generateParticleUpdateFunction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/getAttributeInfoFromFormat.mjs [app-ssr] (ecmascript)");
;
"use strict";
function generateParticleUpdateFunction(properties) {
    return {
        dynamicUpdate: generateUpdateFunction(properties, true),
        staticUpdate: generateUpdateFunction(properties, false)
    };
}
function generateUpdateFunction(properties, dynamic) {
    const funcFragments = [];
    funcFragments.push(`

        var index = 0;

        for (let i = 0; i < ps.length; ++i)
        {
            const p = ps[i];

            `);
    let offset = 0;
    for(const i in properties){
        const property = properties[i];
        if (dynamic !== property.dynamic) continue;
        funcFragments.push(`offset = index + ${offset}`);
        funcFragments.push(property.code);
        const attributeInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAttributeInfoFromFormat"])(property.format);
        offset += attributeInfo.stride / 4;
    }
    funcFragments.push(`
            index += stride * 4;
        }
    `);
    funcFragments.unshift(`
        var stride = ${offset};
    `);
    const functionSource = funcFragments.join("\n");
    return new Function("ps", "f32v", "u32v", functionSource);
}
;
 //# sourceMappingURL=generateParticleUpdateFunction.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/ParticleBuffer.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ParticleBuffer",
    ()=>ParticleBuffer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/Buffer.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$Geometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/Geometry.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/getAttributeInfoFromFormat.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$ViewableBuffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/ViewableBuffer.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$utils$2f$createIndicesForQuads$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/utils/createIndicesForQuads.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$utils$2f$generateParticleUpdateFunction$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/utils/generateParticleUpdateFunction.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
class ParticleBuffer {
    constructor(options){
        this._size = 0;
        this._generateParticleUpdateCache = {};
        const size = this._size = options.size ?? 1e3;
        const properties = options.properties;
        let staticVertexSize = 0;
        let dynamicVertexSize = 0;
        for(const i in properties){
            const property = properties[i];
            const attributeInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAttributeInfoFromFormat"])(property.format);
            if (property.dynamic) {
                dynamicVertexSize += attributeInfo.stride;
            } else {
                staticVertexSize += attributeInfo.stride;
            }
        }
        this._dynamicStride = dynamicVertexSize / 4;
        this._staticStride = staticVertexSize / 4;
        this.staticAttributeBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$ViewableBuffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ViewableBuffer"](size * 4 * staticVertexSize);
        this.dynamicAttributeBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$ViewableBuffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ViewableBuffer"](size * 4 * dynamicVertexSize);
        this.indexBuffer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$utils$2f$createIndicesForQuads$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createIndicesForQuads"])(size);
        const geometry = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$Geometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Geometry"]();
        let dynamicOffset = 0;
        let staticOffset = 0;
        this._staticBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Buffer"]({
            data: new Float32Array(1),
            label: "static-particle-buffer",
            shrinkToFit: false,
            usage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].VERTEX | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST
        });
        this._dynamicBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Buffer"]({
            data: new Float32Array(1),
            label: "dynamic-particle-buffer",
            shrinkToFit: false,
            usage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].VERTEX | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST
        });
        for(const i in properties){
            const property = properties[i];
            const attributeInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAttributeInfoFromFormat"])(property.format);
            if (property.dynamic) {
                geometry.addAttribute(property.attributeName, {
                    buffer: this._dynamicBuffer,
                    stride: this._dynamicStride * 4,
                    offset: dynamicOffset * 4,
                    format: property.format
                });
                dynamicOffset += attributeInfo.size;
            } else {
                geometry.addAttribute(property.attributeName, {
                    buffer: this._staticBuffer,
                    stride: this._staticStride * 4,
                    offset: staticOffset * 4,
                    format: property.format
                });
                staticOffset += attributeInfo.size;
            }
        }
        geometry.addIndex(this.indexBuffer);
        const uploadFunction = this.getParticleUpdate(properties);
        this._dynamicUpload = uploadFunction.dynamicUpdate;
        this._staticUpload = uploadFunction.staticUpdate;
        this.geometry = geometry;
    }
    getParticleUpdate(properties) {
        const key = getParticleSyncKey(properties);
        if (this._generateParticleUpdateCache[key]) {
            return this._generateParticleUpdateCache[key];
        }
        this._generateParticleUpdateCache[key] = this.generateParticleUpdate(properties);
        return this._generateParticleUpdateCache[key];
    }
    generateParticleUpdate(properties) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$utils$2f$generateParticleUpdateFunction$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateParticleUpdateFunction"])(properties);
    }
    update(particles, uploadStatic) {
        if (particles.length > this._size) {
            uploadStatic = true;
            this._size = Math.max(particles.length, this._size * 1.5 | 0);
            this.staticAttributeBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$ViewableBuffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ViewableBuffer"](this._size * this._staticStride * 4 * 4);
            this.dynamicAttributeBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$ViewableBuffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ViewableBuffer"](this._size * this._dynamicStride * 4 * 4);
            this.indexBuffer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$utils$2f$createIndicesForQuads$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createIndicesForQuads"])(this._size);
            this.geometry.indexBuffer.setDataWithSize(this.indexBuffer, this.indexBuffer.byteLength, true);
        }
        const dynamicAttributeBuffer = this.dynamicAttributeBuffer;
        this._dynamicUpload(particles, dynamicAttributeBuffer.float32View, dynamicAttributeBuffer.uint32View);
        this._dynamicBuffer.setDataWithSize(this.dynamicAttributeBuffer.float32View, particles.length * this._dynamicStride * 4, true);
        if (uploadStatic) {
            const staticAttributeBuffer = this.staticAttributeBuffer;
            this._staticUpload(particles, staticAttributeBuffer.float32View, staticAttributeBuffer.uint32View);
            this._staticBuffer.setDataWithSize(staticAttributeBuffer.float32View, particles.length * this._staticStride * 4, true);
        }
    }
    destroy() {
        this._staticBuffer.destroy();
        this._dynamicBuffer.destroy();
        this.geometry.destroy();
    }
}
function getParticleSyncKey(properties) {
    const keyGen = [];
    for(const key in properties){
        const property = properties[key];
        keyGen.push(key, property.code, property.dynamic ? "d" : "s");
    }
    return keyGen.join("_");
}
;
 //# sourceMappingURL=ParticleBuffer.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/shader/particles.frag.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>fragment
]);
var fragment = "varying vec2 vUV;\nvarying vec4 vColor;\n\nuniform sampler2D uTexture;\n\nvoid main(void){\n    vec4 color = texture2D(uTexture, vUV) * vColor;\n    gl_FragColor = color;\n}";
;
 //# sourceMappingURL=particles.frag.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/shader/particles.vert.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>vertex
]);
var vertex = "attribute vec2 aVertex;\nattribute vec2 aUV;\nattribute vec4 aColor;\n\nattribute vec2 aPosition;\nattribute float aRotation;\n\nuniform mat3 uTranslationMatrix;\nuniform float uRound;\nuniform vec2 uResolution;\nuniform vec4 uColor;\n\nvarying vec2 vUV;\nvarying vec4 vColor;\n\nvec2 roundPixels(vec2 position, vec2 targetSize)\n{       \n    return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;\n}\n\nvoid main(void){\n    float cosRotation = cos(aRotation);\n    float sinRotation = sin(aRotation);\n    float x = aVertex.x * cosRotation - aVertex.y * sinRotation;\n    float y = aVertex.x * sinRotation + aVertex.y * cosRotation;\n\n    vec2 v = vec2(x, y);\n    v = v + aPosition;\n\n    gl_Position = vec4((uTranslationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);\n\n    if(uRound == 1.0)\n    {\n        gl_Position.xy = roundPixels(gl_Position.xy, uResolution);\n    }\n\n    vUV = aUV;\n    vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uColor;\n}\n";
;
 //# sourceMappingURL=particles.vert.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/shader/particles.wgsl.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>wgsl
]);
var wgsl = "\nstruct ParticleUniforms {\n  uTranslationMatrix:mat3x3<f32>,\n  uColor:vec4<f32>,\n  uRound:f32,\n  uResolution:vec2<f32>,\n};\n\nfn roundPixels(position: vec2<f32>, targetSize: vec2<f32>) -> vec2<f32>\n{\n  return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;\n}\n\n@group(0) @binding(0) var<uniform> uniforms: ParticleUniforms;\n\n@group(1) @binding(0) var uTexture: texture_2d<f32>;\n@group(1) @binding(1) var uSampler : sampler;\n\nstruct VSOutput {\n    @builtin(position) position: vec4<f32>,\n    @location(0) uv : vec2<f32>,\n    @location(1) color : vec4<f32>,\n  };\n@vertex\nfn mainVertex(\n  @location(0) aVertex: vec2<f32>,\n  @location(1) aPosition: vec2<f32>,\n  @location(2) aUV: vec2<f32>,\n  @location(3) aColor: vec4<f32>,\n  @location(4) aRotation: f32,\n) -> VSOutput {\n  \n   let v = vec2(\n       aVertex.x * cos(aRotation) - aVertex.y * sin(aRotation),\n       aVertex.x * sin(aRotation) + aVertex.y * cos(aRotation)\n   ) + aPosition;\n\n   var position = vec4((uniforms.uTranslationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);\n\n   if(uniforms.uRound == 1.0) {\n       position = vec4(roundPixels(position.xy, uniforms.uResolution), position.zw);\n   }\n\n    let vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uniforms.uColor;\n\n  return VSOutput(\n   position,\n   aUV,\n   vColor,\n  );\n}\n\n@fragment\nfn mainFragment(\n  @location(0) uv: vec2<f32>,\n  @location(1) color: vec4<f32>,\n  @builtin(position) position: vec4<f32>,\n) -> @location(0) vec4<f32> {\n\n    var sample = textureSample(uTexture, uSampler, uv) * color;\n   \n    return sample;\n}";
;
 //# sourceMappingURL=particles.wgsl.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/shader/ParticleShader.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ParticleShader",
    ()=>ParticleShader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureStyle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$shader$2f$particles$2e$frag$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/shader/particles.frag.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$shader$2f$particles$2e$vert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/shader/particles.vert.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$shader$2f$particles$2e$wgsl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/shader/particles.wgsl.mjs [app-ssr] (ecmascript)");
;
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
class ParticleShader extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Shader"] {
    constructor(){
        const glProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlProgram"].from({
            vertex: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$shader$2f$particles$2e$vert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
            fragment: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$shader$2f$particles$2e$frag$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
        });
        const gpuProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuProgram"].from({
            fragment: {
                source: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$shader$2f$particles$2e$wgsl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
                entryPoint: "mainFragment"
            },
            vertex: {
                source: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$shader$2f$particles$2e$wgsl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
                entryPoint: "mainVertex"
            }
        });
        super({
            glProgram,
            gpuProgram,
            resources: {
                // this will be replaced with the texture from the particle container
                uTexture: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].WHITE.source,
                // this will be replaced with the texture style from the particle container
                uSampler: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureStyle"]({}),
                // this will be replaced with the local uniforms from the particle container
                uniforms: {
                    uTranslationMatrix: {
                        value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                        type: "mat3x3<f32>"
                    },
                    uColor: {
                        value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](16777215),
                        type: "vec4<f32>"
                    },
                    uRound: {
                        value: 1,
                        type: "f32"
                    },
                    uResolution: {
                        value: [
                            0,
                            0
                        ],
                        type: "vec2<f32>"
                    }
                }
            }
        });
    }
}
;
 //# sourceMappingURL=ParticleShader.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/ParticleContainerPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ParticleContainerPipe",
    ()=>ParticleContainerPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$getAdjustedBlendModeBlend$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/getAdjustedBlendModeBlend.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gpu/colorToUniform.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$ParticleBuffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/ParticleBuffer.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$shader$2f$ParticleShader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/shader/ParticleShader.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
class ParticleContainerPipe {
    /**
   * @param renderer - The renderer this sprite batch works for.
   * @param adaptor
   */ constructor(renderer, adaptor){
        /** @internal */ this.state = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].for2d();
        /** Local uniforms that are used for rendering particles. */ this.localUniforms = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
            uTranslationMatrix: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            uColor: {
                value: new Float32Array(4),
                type: "vec4<f32>"
            },
            uRound: {
                value: 1,
                type: "f32"
            },
            uResolution: {
                value: [
                    0,
                    0
                ],
                type: "vec2<f32>"
            }
        });
        this.renderer = renderer;
        this.adaptor = adaptor;
        this.defaultShader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$shader$2f$ParticleShader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ParticleShader"]();
        this.state = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].for2d();
    }
    validateRenderable(_renderable) {
        return false;
    }
    addRenderable(renderable, instructionSet) {
        this.renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add(renderable);
    }
    getBuffers(renderable) {
        return renderable._gpuData[this.renderer.uid] || this._initBuffer(renderable);
    }
    _initBuffer(renderable) {
        renderable._gpuData[this.renderer.uid] = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$ParticleBuffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ParticleBuffer"]({
            size: renderable.particleChildren.length,
            properties: renderable._properties
        });
        return renderable._gpuData[this.renderer.uid];
    }
    updateRenderable(_renderable) {}
    execute(container) {
        const children = container.particleChildren;
        if (children.length === 0) {
            return;
        }
        const renderer = this.renderer;
        const buffer = this.getBuffers(container);
        container.texture || (container.texture = children[0].texture);
        const state = this.state;
        buffer.update(children, container._childrenDirty);
        container._childrenDirty = false;
        state.blendMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$getAdjustedBlendModeBlend$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAdjustedBlendModeBlend"])(container.blendMode, container.texture._source);
        const uniforms = this.localUniforms.uniforms;
        const transformationMatrix = uniforms.uTranslationMatrix;
        container.worldTransform.copyTo(transformationMatrix);
        transformationMatrix.prepend(renderer.globalUniforms.globalUniformData.projectionMatrix);
        uniforms.uResolution = renderer.globalUniforms.globalUniformData.resolution;
        uniforms.uRound = renderer._roundPixels | container._roundPixels;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["color32BitToUniform"])(container.groupColorAlpha, uniforms.uColor, 0);
        this.adaptor.execute(this, container);
    }
    /** Destroys the ParticleRenderer. */ destroy() {
        this.renderer = null;
        if (this.defaultShader) {
            this.defaultShader.destroy();
            this.defaultShader = null;
        }
    }
}
;
 //# sourceMappingURL=ParticleContainerPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/GlParticleContainerPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlParticleContainerPipe",
    ()=>GlParticleContainerPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$gl$2f$GlParticleContainerAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/gl/GlParticleContainerAdaptor.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$ParticleContainerPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/ParticleContainerPipe.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class GlParticleContainerPipe extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$ParticleContainerPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ParticleContainerPipe"] {
    constructor(renderer){
        super(renderer, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$gl$2f$GlParticleContainerAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlParticleContainerAdaptor"]());
    }
}
/** @ignore */ GlParticleContainerPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes
    ],
    name: "particle"
};
;
 //# sourceMappingURL=GlParticleContainerPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/gpu/GpuParticleContainerAdaptor.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuParticleContainerAdaptor",
    ()=>GpuParticleContainerAdaptor
]);
"use strict";
class GpuParticleContainerAdaptor {
    execute(particleContainerPipe, container) {
        const renderer = particleContainerPipe.renderer;
        const shader = container.shader || particleContainerPipe.defaultShader;
        shader.groups[0] = renderer.renderPipes.uniformBatch.getUniformBindGroup(particleContainerPipe.localUniforms, true);
        shader.groups[1] = renderer.texture.getTextureBindGroup(container.texture);
        const state = particleContainerPipe.state;
        const buffer = particleContainerPipe.getBuffers(container);
        renderer.encoder.draw({
            geometry: buffer.geometry,
            shader: container.shader || particleContainerPipe.defaultShader,
            state,
            size: container.particleChildren.length * 6
        });
    }
}
;
 //# sourceMappingURL=GpuParticleContainerAdaptor.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/GpuParticleContainerPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuParticleContainerPipe",
    ()=>GpuParticleContainerPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$gpu$2f$GpuParticleContainerAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/gpu/GpuParticleContainerAdaptor.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$ParticleContainerPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/ParticleContainerPipe.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class GpuParticleContainerPipe extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$ParticleContainerPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ParticleContainerPipe"] {
    constructor(renderer){
        super(renderer, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$gpu$2f$GpuParticleContainerAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuParticleContainerAdaptor"]());
    }
}
/** @ignore */ GpuParticleContainerPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes
    ],
    name: "particle"
};
;
 //# sourceMappingURL=GpuParticleContainerPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/init.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$GlParticleContainerPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/GlParticleContainerPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$GpuParticleContainerPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/shared/GpuParticleContainerPipe.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$GlParticleContainerPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlParticleContainerPipe"]);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$shared$2f$GpuParticleContainerPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuParticleContainerPipe"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/utils/updateTextBounds.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "updateTextBounds",
    ()=>updateTextBounds
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$updateQuadBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/updateQuadBounds.mjs [app-ssr] (ecmascript)");
;
"use strict";
function updateTextBounds(batchableSprite, text) {
    const { texture, bounds } = batchableSprite;
    const padding = text._style._getFinalPadding();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$updateQuadBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateQuadBounds"])(bounds, text._anchor, texture);
    const paddingOffset = text._anchor._x * padding * 2;
    const paddingOffsetY = text._anchor._y * padding * 2;
    bounds.minX -= padding - paddingOffset;
    bounds.minY -= padding - paddingOffsetY;
    bounds.maxX -= padding - paddingOffset;
    bounds.maxY -= padding - paddingOffsetY;
}
;
 //# sourceMappingURL=updateTextBounds.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/BatchableSprite.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchableSprite",
    ()=>BatchableSprite
]);
"use strict";
class BatchableSprite {
    constructor(){
        this.batcherName = "default";
        this.topology = "triangle-list";
        // batch specific..
        this.attributeSize = 4;
        this.indexSize = 6;
        this.packAsQuad = true;
        this.roundPixels = 0;
        this._attributeStart = 0;
        // location in the buffer
        this._batcher = null;
        this._batch = null;
    }
    get blendMode() {
        return this.renderable.groupBlendMode;
    }
    get color() {
        return this.renderable.groupColorAlpha;
    }
    reset() {
        this.renderable = null;
        this.texture = null;
        this._batcher = null;
        this._batch = null;
        this.bounds = null;
    }
    destroy() {}
}
;
 //# sourceMappingURL=BatchableSprite.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/BatchableText.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchableText",
    ()=>BatchableText
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/BatchableSprite.mjs [app-ssr] (ecmascript)");
;
"use strict";
class BatchableText extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableSprite"] {
    constructor(renderer){
        super();
        this._renderer = renderer;
        renderer.runners.resolutionChange.add(this);
    }
    resolutionChange() {
        const text = this.renderable;
        if (text._autoResolution) {
            text.onViewUpdate();
        }
    }
    destroy() {
        const { canvasText } = this._renderer;
        canvasText.getReferenceCount(this.currentKey) === null ? canvasText.returnTexture(this.texture) : canvasText.decreaseReferenceCount(this.currentKey);
        this._renderer.runners.resolutionChange.remove(this);
        this._renderer = null;
    }
}
;
 //# sourceMappingURL=BatchableText.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CanvasTextPipe",
    ()=>CanvasTextPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$utils$2f$updateTextBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/utils/updateTextBounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$BatchableText$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/BatchableText.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class CanvasTextPipe {
    constructor(renderer){
        this._renderer = renderer;
    }
    validateRenderable(text) {
        const gpuText = this._getGpuText(text);
        const newKey = text.styleKey;
        if (gpuText.currentKey !== newKey) return true;
        return text._didTextUpdate;
    }
    addRenderable(text, instructionSet) {
        const batchableText = this._getGpuText(text);
        if (text._didTextUpdate) {
            const resolution = text._autoResolution ? this._renderer.resolution : text.resolution;
            if (batchableText.currentKey !== text.styleKey || text.resolution !== resolution) {
                this._updateGpuText(text);
            }
            text._didTextUpdate = false;
        }
        this._renderer.renderPipes.batch.addToBatch(batchableText, instructionSet);
    }
    updateRenderable(text) {
        const batchableText = this._getGpuText(text);
        batchableText._batcher.updateElement(batchableText);
    }
    _updateGpuText(text) {
        const batchableText = this._getGpuText(text);
        if (batchableText.texture) {
            this._renderer.canvasText.decreaseReferenceCount(batchableText.currentKey);
        }
        text._resolution = text._autoResolution ? this._renderer.resolution : text.resolution;
        batchableText.texture = this._renderer.canvasText.getManagedTexture(text);
        batchableText.currentKey = text.styleKey;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$utils$2f$updateTextBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateTextBounds"])(batchableText, text);
    }
    _getGpuText(text) {
        return text._gpuData[this._renderer.uid] || this.initGpuText(text);
    }
    initGpuText(text) {
        const batchableText = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$BatchableText$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableText"](this._renderer);
        batchableText.currentKey = "--";
        batchableText.renderable = text;
        batchableText.transform = text.groupTransform;
        batchableText.bounds = {
            minX: 0,
            maxX: 1,
            minY: 0,
            maxY: 0
        };
        batchableText.roundPixels = this._renderer._roundPixels | text._roundPixels;
        text._gpuData[this._renderer.uid] = batchableText;
        return batchableText;
    }
    destroy() {
        this._renderer = null;
    }
}
/** @ignore */ CanvasTextPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "text"
};
;
 //# sourceMappingURL=CanvasTextPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/utils/getPo2TextureFromSource.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPo2TextureFromSource",
    ()=>getPo2TextureFromSource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TexturePool.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
const tempBounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bounds"]();
function getPo2TextureFromSource(image, width, height, resolution) {
    const bounds = tempBounds;
    bounds.minX = 0;
    bounds.minY = 0;
    bounds.maxX = image.width / resolution | 0;
    bounds.maxY = image.height / resolution | 0;
    const texture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].getOptimalTexture(bounds.width, bounds.height, resolution, false);
    texture.source.uploadMethodId = "image";
    texture.source.resource = image;
    texture.source.alphaMode = "premultiply-alpha-on-upload";
    texture.frame.width = width / resolution;
    texture.frame.height = height / resolution;
    texture.source.emit("update", texture.source);
    texture.updateUvs();
    return texture;
}
;
 //# sourceMappingURL=getPo2TextureFromSource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/canvas/getCanvasBoundingBox.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCanvasBoundingBox",
    ()=>getCanvasBoundingBox
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/misc/pow2.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
let _internalCanvas = null;
let _internalContext = null;
function ensureInternalCanvas(width, height) {
    if (!_internalCanvas) {
        _internalCanvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas(256, 128);
        _internalContext = _internalCanvas.getContext("2d", {
            willReadFrequently: true
        });
        _internalContext.globalCompositeOperation = "copy";
        _internalContext.globalAlpha = 1;
    }
    if (_internalCanvas.width < width || _internalCanvas.height < height) {
        _internalCanvas.width = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["nextPow2"])(width);
        _internalCanvas.height = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$pow2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["nextPow2"])(height);
    }
}
function checkRow(data, width, y) {
    for(let x = 0, index = 4 * y * width; x < width; ++x, index += 4){
        if (data[index + 3] !== 0) return false;
    }
    return true;
}
function checkColumn(data, width, x, top, bottom) {
    const stride = 4 * width;
    for(let y = top, index = top * stride + 4 * x; y <= bottom; ++y, index += stride){
        if (data[index + 3] !== 0) return false;
    }
    return true;
}
function getCanvasBoundingBox(...args) {
    let options = args[0];
    if (!options.canvas) {
        options = {
            canvas: args[0],
            resolution: args[1]
        };
    }
    const { canvas } = options;
    const resolution = Math.min(options.resolution ?? 1, 1);
    const width = options.width ?? canvas.width;
    const height = options.height ?? canvas.height;
    let output = options.output;
    ensureInternalCanvas(width, height);
    if (!_internalContext) {
        throw new TypeError("Failed to get canvas 2D context");
    }
    _internalContext.drawImage(canvas, 0, 0, width, height, 0, 0, width * resolution, height * resolution);
    const imageData = _internalContext.getImageData(0, 0, width, height);
    const data = imageData.data;
    let left = 0;
    let top = 0;
    let right = width - 1;
    let bottom = height - 1;
    while(top < height && checkRow(data, width, top))++top;
    if (top === height) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"].EMPTY;
    while(checkRow(data, width, bottom))--bottom;
    while(checkColumn(data, width, left, top, bottom))++left;
    while(checkColumn(data, width, right, top, bottom))--right;
    ++right;
    ++bottom;
    _internalContext.globalCompositeOperation = "source-over";
    _internalContext.strokeRect(left, top, right - left, bottom - top);
    _internalContext.globalCompositeOperation = "copy";
    output ?? (output = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"]());
    output.set(left / resolution, top / resolution, (right - left) / resolution, (bottom - top) / resolution);
    return output;
}
;
 //# sourceMappingURL=getCanvasBoundingBox.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextGenerator.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CanvasTextGenerator",
    ()=>CanvasTextGenerator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/CanvasPool.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$canvas$2f$getCanvasBoundingBox$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/canvas/getCanvasBoundingBox.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextMetrics.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$fontStringFromTextStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/utils/fontStringFromTextStyle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$getCanvasFillStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/utils/getCanvasFillStyle.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
const tempRect = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"]();
class CanvasTextGeneratorClass {
    /**
   * Creates a canvas with the specified text rendered to it.
   *
   * Generates a canvas of appropriate size, renders the text with the provided style,
   * and returns both the canvas/context and a Rectangle representing the text bounds.
   *
   * When trim is enabled in the style, the frame will represent the bounds of the
   * non-transparent pixels, which can be smaller than the full canvas.
   * @param options - The options for generating the text canvas
   * @param options.text - The text to render
   * @param options.style - The style to apply to the text
   * @param options.resolution - The resolution of the canvas (defaults to 1)
   * @param options.padding
   * @returns An object containing the canvas/context and the frame (bounds) of the text
   */ getCanvasAndContext(options) {
        const { text, style, resolution = 1 } = options;
        const padding = style._getFinalPadding();
        const measured = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTextMetrics"].measureText(text || " ", style);
        const width = Math.ceil(Math.ceil(Math.max(1, measured.width) + padding * 2) * resolution);
        const height = Math.ceil(Math.ceil(Math.max(1, measured.height) + padding * 2) * resolution);
        const canvasAndContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasPool"].getOptimalCanvasAndContext(width, height);
        this._renderTextToCanvas(text, style, padding, resolution, canvasAndContext);
        const frame = style.trim ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$canvas$2f$getCanvasBoundingBox$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCanvasBoundingBox"])({
            canvas: canvasAndContext.canvas,
            width,
            height,
            resolution: 1,
            output: tempRect
        }) : tempRect.set(0, 0, width, height);
        return {
            canvasAndContext,
            frame
        };
    }
    /**
   * Returns a canvas and context to the pool.
   *
   * This should be called when you're done with the canvas to allow reuse
   * and prevent memory leaks.
   * @param canvasAndContext - The canvas and context to return to the pool
   */ returnCanvasAndContext(canvasAndContext) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasPool"].returnCanvasAndContext(canvasAndContext);
    }
    /**
   * Renders text to its canvas, and updates its texture.
   * @param text - The text to render
   * @param style - The style of the text
   * @param padding - The padding of the text
   * @param resolution - The resolution of the text
   * @param canvasAndContext - The canvas and context to render the text to
   */ _renderTextToCanvas(text, style, padding, resolution, canvasAndContext) {
        const { canvas, context } = canvasAndContext;
        const font = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$fontStringFromTextStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fontStringFromTextStyle"])(style);
        const measured = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTextMetrics"].measureText(text || " ", style);
        const lines = measured.lines;
        const lineHeight = measured.lineHeight;
        const lineWidths = measured.lineWidths;
        const maxLineWidth = measured.maxLineWidth;
        const fontProperties = measured.fontProperties;
        const height = canvas.height;
        context.resetTransform();
        context.scale(resolution, resolution);
        context.textBaseline = style.textBaseline;
        if (style._stroke?.width) {
            const strokeStyle = style._stroke;
            context.lineWidth = strokeStyle.width;
            context.miterLimit = strokeStyle.miterLimit;
            context.lineJoin = strokeStyle.join;
            context.lineCap = strokeStyle.cap;
        }
        context.font = font;
        let linePositionX;
        let linePositionY;
        const passesCount = style.dropShadow ? 2 : 1;
        for(let i = 0; i < passesCount; ++i){
            const isShadowPass = style.dropShadow && i === 0;
            const dsOffsetText = isShadowPass ? Math.ceil(Math.max(1, height) + padding * 2) : 0;
            const dsOffsetShadow = dsOffsetText * resolution;
            if (isShadowPass) {
                context.fillStyle = "black";
                context.strokeStyle = "black";
                const shadowOptions = style.dropShadow;
                const dropShadowColor = shadowOptions.color;
                const dropShadowAlpha = shadowOptions.alpha;
                context.shadowColor = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"].shared.setValue(dropShadowColor).setAlpha(dropShadowAlpha).toRgbaString();
                const dropShadowBlur = shadowOptions.blur * resolution;
                const dropShadowDistance = shadowOptions.distance * resolution;
                context.shadowBlur = dropShadowBlur;
                context.shadowOffsetX = Math.cos(shadowOptions.angle) * dropShadowDistance;
                context.shadowOffsetY = Math.sin(shadowOptions.angle) * dropShadowDistance + dsOffsetShadow;
            } else {
                context.fillStyle = style._fill ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$getCanvasFillStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCanvasFillStyle"])(style._fill, context, measured, padding * 2) : null;
                if (style._stroke?.width) {
                    const strokePadding = style._stroke.width * 0.5 + padding * 2;
                    context.strokeStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$getCanvasFillStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCanvasFillStyle"])(style._stroke, context, measured, strokePadding);
                }
                context.shadowColor = "black";
            }
            let linePositionYShift = (lineHeight - fontProperties.fontSize) / 2;
            if (lineHeight - fontProperties.fontSize < 0) {
                linePositionYShift = 0;
            }
            const strokeWidth = style._stroke?.width ?? 0;
            for(let i2 = 0; i2 < lines.length; i2++){
                linePositionX = strokeWidth / 2;
                linePositionY = strokeWidth / 2 + i2 * lineHeight + fontProperties.ascent + linePositionYShift;
                if (style.align === "right") {
                    linePositionX += maxLineWidth - lineWidths[i2];
                } else if (style.align === "center") {
                    linePositionX += (maxLineWidth - lineWidths[i2]) / 2;
                }
                if (style._stroke?.width) {
                    this._drawLetterSpacing(lines[i2], style, canvasAndContext, linePositionX + padding, linePositionY + padding - dsOffsetText, true);
                }
                if (style._fill !== void 0) {
                    this._drawLetterSpacing(lines[i2], style, canvasAndContext, linePositionX + padding, linePositionY + padding - dsOffsetText);
                }
            }
        }
    }
    /**
   * Render the text with letter-spacing.
   *
   * This method handles rendering text with the correct letter spacing, using either:
   * 1. Native letter spacing if supported by the browser
   * 2. Manual letter spacing calculation if not natively supported
   *
   * For manual letter spacing, it calculates the position of each character
   * based on its width and the desired spacing.
   * @param text - The text to draw
   * @param style - The text style to apply
   * @param canvasAndContext - The canvas and context to draw to
   * @param x - Horizontal position to draw the text
   * @param y - Vertical position to draw the text
   * @param isStroke - Whether to render the stroke (true) or fill (false)
   * @private
   */ _drawLetterSpacing(text, style, canvasAndContext, x, y, isStroke = false) {
        const { context } = canvasAndContext;
        const letterSpacing = style.letterSpacing;
        let useExperimentalLetterSpacing = false;
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTextMetrics"].experimentalLetterSpacingSupported) {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTextMetrics"].experimentalLetterSpacing) {
                context.letterSpacing = `${letterSpacing}px`;
                context.textLetterSpacing = `${letterSpacing}px`;
                useExperimentalLetterSpacing = true;
            } else {
                context.letterSpacing = "0px";
                context.textLetterSpacing = "0px";
            }
        }
        if (letterSpacing === 0 || useExperimentalLetterSpacing) {
            if (isStroke) {
                context.strokeText(text, x, y);
            } else {
                context.fillText(text, x, y);
            }
            return;
        }
        let currentPosition = x;
        const stringArray = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTextMetrics"].graphemeSegmenter(text);
        let previousWidth = context.measureText(text).width;
        let currentWidth = 0;
        for(let i = 0; i < stringArray.length; ++i){
            const currentChar = stringArray[i];
            if (isStroke) {
                context.strokeText(currentChar, currentPosition, y);
            } else {
                context.fillText(currentChar, currentPosition, y);
            }
            let textStr = "";
            for(let j = i + 1; j < stringArray.length; ++j){
                textStr += stringArray[j];
            }
            currentWidth = context.measureText(textStr).width;
            currentPosition += previousWidth - currentWidth + letterSpacing;
            previousWidth = currentWidth;
        }
    }
}
const CanvasTextGenerator = new CanvasTextGeneratorClass();
;
 //# sourceMappingURL=CanvasTextGenerator.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CanvasTextSystem",
    ()=>CanvasTextSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TexturePool.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureStyle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$TextStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/TextStyle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$utils$2f$getPo2TextureFromSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/utils/getPo2TextureFromSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextGenerator$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextGenerator.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
class CanvasTextSystem {
    constructor(_renderer){
        this._activeTextures = {};
        this._renderer = _renderer;
    }
    getTexture(options, _resolution, _style, _textKey) {
        if (typeof options === "string") {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])("8.0.0", "CanvasTextSystem.getTexture: Use object TextOptions instead of separate arguments");
            options = {
                text: options,
                style: _style,
                resolution: _resolution
            };
        }
        if (!(options.style instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$TextStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextStyle"])) {
            options.style = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$TextStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextStyle"](options.style);
        }
        if (!(options.textureStyle instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureStyle"])) {
            options.textureStyle = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureStyle"](options.textureStyle);
        }
        if (typeof options.text !== "string") {
            options.text = options.text.toString();
        }
        const { text, style, textureStyle } = options;
        const resolution = options.resolution ?? this._renderer.resolution;
        const { frame, canvasAndContext } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextGenerator$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTextGenerator"].getCanvasAndContext({
            text,
            style,
            resolution
        });
        const texture = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$utils$2f$getPo2TextureFromSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPo2TextureFromSource"])(canvasAndContext.canvas, frame.width, frame.height, resolution);
        if (textureStyle) texture.source.style = textureStyle;
        if (style.trim) {
            frame.pad(style.padding);
            texture.frame.copyFrom(frame);
            texture.frame.scale(1 / resolution);
            texture.updateUvs();
        }
        if (style.filters) {
            const filteredTexture = this._applyFilters(texture, style.filters);
            this.returnTexture(texture);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextGenerator$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTextGenerator"].returnCanvasAndContext(canvasAndContext);
            return filteredTexture;
        }
        this._renderer.texture.initSource(texture._source);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextGenerator$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTextGenerator"].returnCanvasAndContext(canvasAndContext);
        return texture;
    }
    /**
   * Returns a texture that was created wit the above `getTexture` function.
   * Handy if you are done with a texture and want to return it to the pool.
   * @param texture - The texture to be returned.
   */ returnTexture(texture) {
        const source = texture.source;
        source.resource = null;
        source.uploadMethodId = "unknown";
        source.alphaMode = "no-premultiply-alpha";
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(texture, true);
    }
    /**
   * Renders text to its canvas, and updates its texture.
   * @deprecated since 8.10.0
   */ renderTextToCanvas() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])("8.10.0", "CanvasTextSystem.renderTextToCanvas: no longer supported, use CanvasTextSystem.getTexture instead");
    }
    /**
   * Gets or creates a managed texture for a Text object. This method handles texture reuse and reference counting.
   * @param text - The Text object that needs a texture
   * @returns A Texture instance that represents the rendered text
   * @remarks
   * This method performs the following:
   * 1. Sets the appropriate resolution based on auto-resolution settings
   * 2. Checks if a texture already exists for the text's style
   * 3. Creates a new texture if needed or returns an existing one
   * 4. Manages reference counting for texture reuse
   */ getManagedTexture(text) {
        text._resolution = text._autoResolution ? this._renderer.resolution : text.resolution;
        const textKey = text.styleKey;
        if (this._activeTextures[textKey]) {
            this._increaseReferenceCount(textKey);
            return this._activeTextures[textKey].texture;
        }
        const texture = this.getTexture({
            text: text.text,
            style: text.style,
            resolution: text._resolution,
            textureStyle: text.textureStyle
        });
        this._activeTextures[textKey] = {
            texture,
            usageCount: 1
        };
        return texture;
    }
    /**
   * Decreases the reference count for a texture associated with a text key.
   * When the reference count reaches zero, the texture is returned to the pool.
   * @param textKey - The unique key identifying the text style configuration
   * @remarks
   * This method is crucial for memory management, ensuring textures are properly
   * cleaned up when they are no longer needed by any Text instances.
   */ decreaseReferenceCount(textKey) {
        const activeTexture = this._activeTextures[textKey];
        activeTexture.usageCount--;
        if (activeTexture.usageCount === 0) {
            this.returnTexture(activeTexture.texture);
            this._activeTextures[textKey] = null;
        }
    }
    /**
   * Gets the current reference count for a texture associated with a text key.
   * @param textKey - The unique key identifying the text style configuration
   * @returns The number of Text instances currently using this texture
   */ getReferenceCount(textKey) {
        return this._activeTextures[textKey]?.usageCount ?? null;
    }
    _increaseReferenceCount(textKey) {
        this._activeTextures[textKey].usageCount++;
    }
    /**
   * Applies the specified filters to the given texture.
   *
   * This method takes a texture and a list of filters, applies the filters to the texture,
   * and returns the resulting texture. It also ensures that the alpha mode of the resulting
   * texture is set to 'premultiplied-alpha'.
   * @param {Texture} texture - The texture to which the filters will be applied.
   * @param {Filter[]} filters - The filters to apply to the texture.
   * @returns {Texture} The resulting texture after all filters have been applied.
   */ _applyFilters(texture, filters) {
        const currentRenderTarget = this._renderer.renderTarget.renderTarget;
        const resultTexture = this._renderer.filter.generateFilteredTexture({
            texture,
            filters
        });
        this._renderer.renderTarget.bind(currentRenderTarget, false);
        return resultTexture;
    }
    destroy() {
        this._renderer = null;
        for(const key in this._activeTextures){
            if (this._activeTextures[key]) this.returnTexture(this._activeTextures[key].texture);
        }
        this._activeTextures = null;
    }
}
/** @ignore */ CanvasTextSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "canvasText"
};
;
 //# sourceMappingURL=CanvasTextSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/init.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextSystem.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTextSystem"]);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTextPipe"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/Graphics.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Graphics",
    ()=>Graphics
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$view$2f$ViewContainer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/view/ViewContainer.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/GraphicsContext.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class Graphics extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$view$2f$ViewContainer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ViewContainer"] {
    /**
   * Creates a new Graphics object.
   * @param options - Options for the Graphics.
   */ constructor(options){
        if (options instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GraphicsContext"]) {
            options = {
                context: options
            };
        }
        const { context, roundPixels, ...rest } = options || {};
        super({
            label: "Graphics",
            ...rest
        });
        /** @internal */ this.renderPipeId = "graphics";
        if (!context) {
            this._context = this._ownedContext = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GraphicsContext"]();
        } else {
            this._context = context;
        }
        this._context.on("update", this.onViewUpdate, this);
        this.didViewUpdate = true;
        this.allowChildren = false;
        this.roundPixels = roundPixels ?? false;
    }
    set context(context) {
        if (context === this._context) return;
        this._context.off("update", this.onViewUpdate, this);
        this._context = context;
        this._context.on("update", this.onViewUpdate, this);
        this.onViewUpdate();
    }
    /**
   * The underlying graphics context used for drawing operations.
   * Controls how shapes and paths are rendered.
   * @example
   * ```ts
   * // Create a shared context
   * const sharedContext = new GraphicsContext();
   *
   * // Create graphics objects sharing the same context
   * const graphics1 = new Graphics();
   * const graphics2 = new Graphics();
   *
   * // Assign shared context
   * graphics1.context = sharedContext;
   * graphics2.context = sharedContext;
   *
   * // Both graphics will show the same shapes
   * sharedContext
   *     .rect(0, 0, 100, 100)
   *     .fill({ color: 0xff0000 });
   * ```
   * @see {@link GraphicsContext} For drawing operations
   * @see {@link GraphicsOptions} For context configuration
   */ get context() {
        return this._context;
    }
    /**
   * The local bounds of the graphics object.
   * Returns the boundaries after all graphical operations but before any transforms.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Draw a shape
   * graphics
   *     .rect(0, 0, 100, 100)
   *     .fill({ color: 0xff0000 });
   *
   * // Get bounds information
   * const bounds = graphics.bounds;
   * console.log(bounds.width);  // 100
   * console.log(bounds.height); // 100
   * ```
   * @readonly
   * @see {@link Bounds} For bounds operations
   * @see {@link Container#getBounds} For transformed bounds
   */ get bounds() {
        return this._context.bounds;
    }
    /**
   * Graphics objects do not need to update their bounds as the context handles this.
   * @private
   */ updateBounds() {}
    /**
   * Checks if the object contains the given point.
   * Returns true if the point lies within the Graphics object's rendered area.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Draw a shape
   * graphics
   *     .rect(0, 0, 100, 100)
   *     .fill({ color: 0xff0000 });
   *
   * // Check point intersection
   * if (graphics.containsPoint({ x: 50, y: 50 })) {
   *     console.log('Point is inside rectangle!');
   * }
   * ```
   * @param point - The point to check in local coordinates
   * @returns True if the point is inside the Graphics object
   * @see {@link Graphics#bounds} For bounding box checks
   * @see {@link PointData} For point data structure
   */ containsPoint(point) {
        return this._context.containsPoint(point);
    }
    /**
   * Destroys this graphics renderable and optionally its context.
   * @param options - Options parameter. A boolean will act as if all options
   *
   * If the context was created by this graphics and `destroy(false)` or `destroy()` is called
   * then the context will still be destroyed.
   *
   * If you want to explicitly not destroy this context that this graphics created,
   * then you should pass destroy({ context: false })
   *
   * If the context was passed in as an argument to the constructor then it will not be destroyed
   * @example
   * ```ts
   * // Destroy the graphics and its context
   * graphics.destroy();
   * graphics.destroy(true);
   * graphics.destroy({ context: true, texture: true, textureSource: true });
   * ```
   */ destroy(options) {
        if (this._ownedContext && !options) {
            this._ownedContext.destroy(options);
        } else if (options === true || options?.context === true) {
            this._context.destroy(options);
        }
        this._ownedContext = null;
        this._context = null;
        super.destroy(options);
    }
    _callContextMethod(method, args) {
        this.context[method](...args);
        return this;
    }
    // --------------------------------------- GraphicsContext methods ---------------------------------------
    /**
   * Sets the current fill style of the graphics context.
   * The fill style can be a color, gradient, pattern, or a complex style object.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Basic color fill
   * graphics
   *     .setFillStyle({ color: 0xff0000 }) // Red fill
   *     .rect(0, 0, 100, 100)
   *     .fill();
   *
   * // Gradient fill
   * const gradient = new FillGradient({
   *    end: { x: 1, y: 0 },
   *    colorStops: [
   *         { offset: 0, color: 0xff0000 }, // Red at start
   *         { offset: 0.5, color: 0x00ff00 }, // Green at middle
   *         { offset: 1, color: 0x0000ff }, // Blue at end
   *    ],
   * });
   *
   * graphics
   *     .setFillStyle(gradient)
   *     .circle(100, 100, 50)
   *     .fill();
   *
   * // Pattern fill
   * const pattern = new FillPattern(texture);
   * graphics
   *     .setFillStyle({
   *         fill: pattern,
   *         alpha: 0.5
   *     })
   *     .rect(0, 0, 200, 200)
   *     .fill();
   * ```
   * @param {FillInput} args - The fill style to apply
   * @returns The Graphics instance for chaining
   * @see {@link FillStyle} For fill style options
   * @see {@link FillGradient} For gradient fills
   * @see {@link FillPattern} For pattern fills
   */ setFillStyle(...args) {
        return this._callContextMethod("setFillStyle", args);
    }
    /**
   * Sets the current stroke style of the graphics context.
   * Similar to fill styles, stroke styles can encompass colors, gradients, patterns, or more detailed configurations.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Basic color stroke
   * graphics
   *     .setStrokeStyle({
   *         width: 2,
   *         color: 0x000000
   *     })
   *     .rect(0, 0, 100, 100)
   *     .stroke();
   *
   * // Complex stroke style
   * graphics
   *     .setStrokeStyle({
   *         width: 4,
   *         color: 0xff0000,
   *         alpha: 0.5,
   *         join: 'round',
   *         cap: 'round',
   *         alignment: 0.5
   *     })
   *     .circle(100, 100, 50)
   *     .stroke();
   *
   * // Gradient stroke
   * const gradient = new FillGradient({
   *    end: { x: 1, y: 0 },
   *    colorStops: [
   *         { offset: 0, color: 0xff0000 }, // Red at start
   *         { offset: 0.5, color: 0x00ff00 }, // Green at middle
   *         { offset: 1, color: 0x0000ff }, // Blue at end
   *    ],
   * });
   *
   * graphics
   *     .setStrokeStyle({
   *         width: 10,
   *         fill: gradient
   *     })
   *     .poly([0,0, 100,50, 0,100])
   *     .stroke();
   * ```
   * @param {StrokeInput} args - The stroke style to apply
   * @returns The Graphics instance for chaining
   * @see {@link StrokeStyle} For stroke style options
   * @see {@link FillGradient} For gradient strokes
   * @see {@link FillPattern} For pattern strokes
   */ setStrokeStyle(...args) {
        return this._callContextMethod("setStrokeStyle", args);
    }
    fill(...args) {
        return this._callContextMethod("fill", args);
    }
    /**
   * Strokes the current path with the current stroke style or specified style.
   * Outlines the shape using the stroke settings.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Stroke with direct color
   * graphics
   *     .circle(50, 50, 25)
   *     .stroke({
   *         width: 2,
   *         color: 0xff0000
   *     }); // 2px red stroke
   *
   * // Fill with texture
   * graphics
   *    .rect(0, 0, 100, 100)
   *    .stroke(myTexture); // Fill with texture
   *
   * // Stroke with gradient
   * const gradient = new FillGradient({
   *     end: { x: 1, y: 0 },
   *     colorStops: [
   *         { offset: 0, color: 0xff0000 },
   *         { offset: 0.5, color: 0x00ff00 },
   *         { offset: 1, color: 0x0000ff },
   *     ],
   * });
   *
   * graphics
   *     .rect(0, 0, 100, 100)
   *     .stroke({
   *         width: 4,
   *         fill: gradient,
   *         alignment: 0.5,
   *         join: 'round'
   *     });
   * ```
   * @param {StrokeStyle} args - Optional stroke style to apply. Can be:
   * - A stroke style object with width, color, etc.
   * - A gradient
   * - A pattern
   * If omitted, uses current stroke style.
   * @returns The Graphics instance for chaining
   * @see {@link StrokeStyle} For stroke style options
   * @see {@link FillGradient} For gradient strokes
   * @see {@link setStrokeStyle} For setting default stroke style
   */ stroke(...args) {
        return this._callContextMethod("stroke", args);
    }
    texture(...args) {
        return this._callContextMethod("texture", args);
    }
    /**
   * Resets the current path. Any previous path and its commands are discarded and a new path is
   * started. This is typically called before beginning a new shape or series of drawing commands.
   * @example
   * ```ts
   * const graphics = new Graphics();
   * graphics
   *     .circle(150, 150, 50)
   *     .fill({ color: 0x00ff00 })
   *     .beginPath() // Starts a new path
   *     .circle(250, 150, 50)
   *     .fill({ color: 0x0000ff });
   * ```
   * @returns The Graphics instance for chaining
   * @see {@link Graphics#moveTo} For starting a new subpath
   * @see {@link Graphics#closePath} For closing the current path
   */ beginPath() {
        return this._callContextMethod("beginPath", []);
    }
    /**
   * Applies a cutout to the last drawn shape. This is used to create holes or complex shapes by
   * subtracting a path from the previously drawn path.
   *
   * If a hole is not completely in a shape, it will fail to cut correctly.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Draw outer circle
   * graphics
   *     .circle(100, 100, 50)
   *     .fill({ color: 0xff0000 });
   *     .circle(100, 100, 25) // Inner circle
   *     .cut() // Cuts out the inner circle from the outer circle
   * ```
   */ cut() {
        return this._callContextMethod("cut", []);
    }
    arc(...args) {
        return this._callContextMethod("arc", args);
    }
    arcTo(...args) {
        return this._callContextMethod("arcTo", args);
    }
    arcToSvg(...args) {
        return this._callContextMethod("arcToSvg", args);
    }
    bezierCurveTo(...args) {
        return this._callContextMethod("bezierCurveTo", args);
    }
    /**
   * Closes the current path by drawing a straight line back to the start point.
   *
   * This is useful for completing shapes and ensuring they are properly closed for fills.
   * @example
   * ```ts
   * // Create a triangle with closed path
   * const graphics = new Graphics();
   * graphics
   *     .moveTo(50, 50)
   *     .lineTo(100, 100)
   *     .lineTo(0, 100)
   *     .closePath()
   * ```
   * @returns The Graphics instance for method chaining
   * @see {@link Graphics#beginPath} For starting a new path
   * @see {@link Graphics#fill} For filling closed paths
   * @see {@link Graphics#stroke} For stroking paths
   */ closePath() {
        return this._callContextMethod("closePath", []);
    }
    ellipse(...args) {
        return this._callContextMethod("ellipse", args);
    }
    circle(...args) {
        return this._callContextMethod("circle", args);
    }
    path(...args) {
        return this._callContextMethod("path", args);
    }
    lineTo(...args) {
        return this._callContextMethod("lineTo", args);
    }
    moveTo(...args) {
        return this._callContextMethod("moveTo", args);
    }
    quadraticCurveTo(...args) {
        return this._callContextMethod("quadraticCurveTo", args);
    }
    rect(...args) {
        return this._callContextMethod("rect", args);
    }
    roundRect(...args) {
        return this._callContextMethod("roundRect", args);
    }
    poly(...args) {
        return this._callContextMethod("poly", args);
    }
    regularPoly(...args) {
        return this._callContextMethod("regularPoly", args);
    }
    roundPoly(...args) {
        return this._callContextMethod("roundPoly", args);
    }
    roundShape(...args) {
        return this._callContextMethod("roundShape", args);
    }
    filletRect(...args) {
        return this._callContextMethod("filletRect", args);
    }
    chamferRect(...args) {
        return this._callContextMethod("chamferRect", args);
    }
    star(...args) {
        return this._callContextMethod("star", args);
    }
    svg(...args) {
        return this._callContextMethod("svg", args);
    }
    restore(...args) {
        return this._callContextMethod("restore", args);
    }
    /**
   * Saves the current graphics state onto a stack. The state includes:
   * - Current transformation matrix
   * - Current fill style
   * - Current stroke style
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Save state before complex operations
   * graphics.save();
   *
   * // Create transformed and styled shape
   * graphics
   *     .translateTransform(100, 100)
   *     .rotateTransform(Math.PI / 4)
   *     .setFillStyle({
   *         color: 0xff0000,
   *         alpha: 0.5
   *     })
   *     .rect(-25, -25, 50, 50)
   *     .fill();
   *
   * // Restore to original state
   * graphics.restore();
   *
   * // Continue drawing with previous state
   * graphics
   *     .circle(50, 50, 25)
   *     .fill();
   * ```
   * @returns The Graphics instance for method chaining
   * @see {@link Graphics#restore} For restoring the saved state
   * @see {@link Graphics#setTransform} For setting transformations
   */ save() {
        return this._callContextMethod("save", []);
    }
    /**
   * Returns the current transformation matrix of the graphics context.
   * This matrix represents all accumulated transformations including translate, scale, and rotate.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Apply some transformations
   * graphics
   *     .translateTransform(100, 100)
   *     .rotateTransform(Math.PI / 4);
   *
   * // Get the current transform matrix
   * const matrix = graphics.getTransform();
   * console.log(matrix.tx, matrix.ty); // 100, 100
   *
   * // Use the matrix for other operations
   * graphics
   *     .setTransform(matrix)
   *     .circle(0, 0, 50)
   *     .fill({ color: 0xff0000 });
   * ```
   * @returns The current transformation matrix.
   * @see {@link Graphics#setTransform} For setting the transform matrix
   * @see {@link Matrix} For matrix operations
   */ getTransform() {
        return this.context.getTransform();
    }
    /**
   * Resets the current transformation matrix to the identity matrix, effectively removing
   * any transformations (rotation, scaling, translation) previously applied.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Apply transformations
   * graphics
   *     .translateTransform(100, 100)
   *     .scaleTransform(2, 2)
   *     .circle(0, 0, 25)
   *     .fill({ color: 0xff0000 });
   * // Reset transform to default state
   * graphics
   *     .resetTransform()
   *     .circle(50, 50, 25) // Will draw at actual coordinates
   *     .fill({ color: 0x00ff00 });
   * ```
   * @returns The Graphics instance for method chaining
   * @see {@link Graphics#getTransform} For getting the current transform
   * @see {@link Graphics#setTransform} For setting a specific transform
   * @see {@link Graphics#save} For saving the current transform state
   * @see {@link Graphics#restore} For restoring a previous transform state
   */ resetTransform() {
        return this._callContextMethod("resetTransform", []);
    }
    rotateTransform(...args) {
        return this._callContextMethod("rotate", args);
    }
    scaleTransform(...args) {
        return this._callContextMethod("scale", args);
    }
    setTransform(...args) {
        return this._callContextMethod("setTransform", args);
    }
    transform(...args) {
        return this._callContextMethod("transform", args);
    }
    translateTransform(...args) {
        return this._callContextMethod("translate", args);
    }
    /**
   * Clears all drawing commands from the graphics context, effectively resetting it.
   * This includes clearing the current path, fill style, stroke style, and transformations.
   *
   * > [!NOTE] Graphics objects are not designed to be continuously cleared and redrawn.
   * > Instead, they are intended to be used for static or semi-static graphics that
   * > can be redrawn as needed. Frequent clearing and redrawing may lead to performance issues.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Draw some shapes
   * graphics
   *     .circle(100, 100, 50)
   *     .fill({ color: 0xff0000 })
   *     .rect(200, 100, 100, 50)
   *     .fill({ color: 0x00ff00 });
   *
   * // Clear all graphics
   * graphics.clear();
   *
   * // Start fresh with new shapes
   * graphics
   *     .circle(150, 150, 30)
   *     .fill({ color: 0x0000ff });
   * ```
   * @returns The Graphics instance for method chaining
   * @see {@link Graphics#beginPath} For starting a new path without clearing styles
   * @see {@link Graphics#save} For saving the current state
   * @see {@link Graphics#restore} For restoring a previous state
   */ clear() {
        return this._callContextMethod("clear", []);
    }
    /**
   * Gets or sets the current fill style for the graphics context. The fill style determines
   * how shapes are filled when using the fill() method.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Basic color fill
   * graphics.fillStyle = {
   *     color: 0xff0000,  // Red
   *     alpha: 1
   * };
   *
   * // Using gradients
   * const gradient = new FillGradient({
   *     end: { x: 0, y: 1 }, // Vertical gradient
   *     stops: [
   *         { offset: 0, color: 0xff0000, alpha: 1 }, // Start color
   *         { offset: 1, color: 0x0000ff, alpha: 1 }  // End color
   *     ]
   * });
   *
   * graphics.fillStyle = {
   *     fill: gradient,
   *     alpha: 0.8
   * };
   *
   * // Using patterns
   * graphics.fillStyle = {
   *     texture: myTexture,
   *     alpha: 1,
   *     matrix: new Matrix()
   *         .scale(0.5, 0.5)
   *         .rotate(Math.PI / 4)
   * };
   * ```
   * @type {ConvertedFillStyle}
   * @see {@link FillStyle} For all available fill style options
   * @see {@link FillGradient} For creating gradient fills
   * @see {@link Graphics#fill} For applying the fill to paths
   */ get fillStyle() {
        return this._context.fillStyle;
    }
    set fillStyle(value) {
        this._context.fillStyle = value;
    }
    /**
   * Gets or sets the current stroke style for the graphics context. The stroke style determines
   * how paths are outlined when using the stroke() method.
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Basic stroke style
   * graphics.strokeStyle = {
   *     width: 2,
   *     color: 0xff0000,
   *     alpha: 1
   * };
   *
   * // Using with gradients
   * const gradient = new FillGradient({
   *   end: { x: 0, y: 1 },
   *   stops: [
   *       { offset: 0, color: 0xff0000, alpha: 1 },
   *       { offset: 1, color: 0x0000ff, alpha: 1 }
   *   ]
   * });
   *
   * graphics.strokeStyle = {
   *     width: 4,
   *     fill: gradient,
   *     alignment: 0.5,
   *     join: 'round',
   *     cap: 'round'
   * };
   *
   * // Complex stroke settings
   * graphics.strokeStyle = {
   *     width: 6,
   *     color: 0x00ff00,
   *     alpha: 0.5,
   *     join: 'miter',
   *     miterLimit: 10,
   * };
   * ```
   * @see {@link StrokeStyle} For all available stroke style options
   * @see {@link Graphics#stroke} For applying the stroke to paths
   */ get strokeStyle() {
        return this._context.strokeStyle;
    }
    set strokeStyle(value) {
        this._context.strokeStyle = value;
    }
    /**
   * Creates a new Graphics object that copies the current graphics content.
   * The clone can either share the same context (shallow clone) or have its own independent
   * context (deep clone).
   * @example
   * ```ts
   * const graphics = new Graphics();
   *
   * // Create original graphics content
   * graphics
   *     .circle(100, 100, 50)
   *     .fill({ color: 0xff0000 });
   *
   * // Create a shallow clone (shared context)
   * const shallowClone = graphics.clone();
   *
   * // Changes to original affect the clone
   * graphics
   *     .circle(200, 100, 30)
   *     .fill({ color: 0x00ff00 });
   *
   * // Create a deep clone (independent context)
   * const deepClone = graphics.clone(true);
   *
   * // Modify deep clone independently
   * deepClone
   *     .translateTransform(100, 100)
   *     .circle(0, 0, 40)
   *     .fill({ color: 0x0000ff });
   * ```
   * @param deep - Whether to create a deep clone of the graphics object.
   *              If false (default), the context will be shared between objects.
   *              If true, creates an independent copy of the context.
   * @returns A new Graphics instance with either shared or copied context
   * @see {@link Graphics#context} For accessing the underlying graphics context
   * @see {@link GraphicsContext} For understanding the shared context behavior
   */ clone(deep = false) {
        if (deep) {
            return new Graphics(this._context.clone());
        }
        this._ownedContext = null;
        const clone = new Graphics(this._context);
        return clone;
    }
    // -------- v7 deprecations ---------
    /**
   * @param width
   * @param color
   * @param alpha
   * @deprecated since 8.0.0 Use {@link Graphics#setStrokeStyle} instead
   */ lineStyle(width, color, alpha) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "Graphics#lineStyle is no longer needed. Use Graphics#setStrokeStyle to set the stroke style.");
        const strokeStyle = {};
        width && (strokeStyle.width = width);
        color && (strokeStyle.color = color);
        alpha && (strokeStyle.alpha = alpha);
        this.context.strokeStyle = strokeStyle;
        return this;
    }
    /**
   * @param color
   * @param alpha
   * @deprecated since 8.0.0 Use {@link Graphics#fill} instead
   */ beginFill(color, alpha) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "Graphics#beginFill is no longer needed. Use Graphics#fill to fill the shape with the desired style.");
        const fillStyle = {};
        if (color !== void 0) fillStyle.color = color;
        if (alpha !== void 0) fillStyle.alpha = alpha;
        this.context.fillStyle = fillStyle;
        return this;
    }
    /**
   * @deprecated since 8.0.0 Use {@link Graphics#fill} instead
   */ endFill() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "Graphics#endFill is no longer needed. Use Graphics#fill to fill the shape with the desired style.");
        this.context.fill();
        const strokeStyle = this.context.strokeStyle;
        if (strokeStyle.width !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GraphicsContext"].defaultStrokeStyle.width || strokeStyle.color !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GraphicsContext"].defaultStrokeStyle.color || strokeStyle.alpha !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GraphicsContext"].defaultStrokeStyle.alpha) {
            this.context.stroke();
        }
        return this;
    }
    /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#circle} instead
   */ drawCircle(...args) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "Graphics#drawCircle has been renamed to Graphics#circle");
        return this._callContextMethod("circle", args);
    }
    /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#ellipse} instead
   */ drawEllipse(...args) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "Graphics#drawEllipse has been renamed to Graphics#ellipse");
        return this._callContextMethod("ellipse", args);
    }
    /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#poly} instead
   */ drawPolygon(...args) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "Graphics#drawPolygon has been renamed to Graphics#poly");
        return this._callContextMethod("poly", args);
    }
    /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#rect} instead
   */ drawRect(...args) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "Graphics#drawRect has been renamed to Graphics#rect");
        return this._callContextMethod("rect", args);
    }
    /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#roundRect} instead
   */ drawRoundedRect(...args) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "Graphics#drawRoundedRect has been renamed to Graphics#roundRect");
        return this._callContextMethod("roundRect", args);
    }
    /**
   * @param {...any} args
   * @deprecated since 8.0.0 Use {@link Graphics#star} instead
   */ drawStar(...args) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "Graphics#drawStar has been renamed to Graphics#star");
        return this._callContextMethod("star", args);
    }
}
;
 //# sourceMappingURL=Graphics.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/sdfShader/shader-bits/localUniformMSDFBit.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "localUniformMSDFBit",
    ()=>localUniformMSDFBit,
    "localUniformMSDFBitGl",
    ()=>localUniformMSDFBitGl
]);
"use strict";
const localUniformMSDFBit = {
    name: "local-uniform-msdf-bit",
    vertex: {
        header: /* wgsl */ `
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32,
                uRound:f32,
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `,
        main: /* wgsl */ `
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `,
        end: /* wgsl */ `
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `
    },
    fragment: {
        header: /* wgsl */ `
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
         `,
        main: /* wgsl */ `
            outColor = vec4<f32>(calculateMSDFAlpha(outColor, localUniforms.uColor, localUniforms.uDistance));
        `
    }
};
const localUniformMSDFBitGl = {
    name: "local-uniform-msdf-bit",
    vertex: {
        header: /* glsl */ `
            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `,
        main: /* glsl */ `
            vColor *= uColor;
            modelMatrix *= uTransformMatrix;
        `,
        end: /* glsl */ `
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `
    },
    fragment: {
        header: /* glsl */ `
            uniform float uDistance;
         `,
        main: /* glsl */ `
            outColor = vec4(calculateMSDFAlpha(outColor, vColor, uDistance));
        `
    }
};
;
 //# sourceMappingURL=localUniformMSDFBit.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/sdfShader/shader-bits/mSDFBit.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mSDFBit",
    ()=>mSDFBit,
    "mSDFBitGl",
    ()=>mSDFBitGl
]);
"use strict";
const mSDFBit = {
    name: "msdf-bit",
    fragment: {
        header: /* wgsl */ `
            fn calculateMSDFAlpha(msdfColor:vec4<f32>, shapeColor:vec4<f32>, distance:f32) -> f32 {

                // MSDF
                var median = msdfColor.r + msdfColor.g + msdfColor.b -
                    min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                    max(msdfColor.r, max(msdfColor.g, msdfColor.b));

                // SDF
                median = min(median, msdfColor.a);

                var screenPxDistance = distance * (median - 0.5);
                var alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                var luma: f32 = dot(shapeColor.rgb, vec3<f32>(0.299, 0.587, 0.114));
                var gamma: f32 = mix(1.0, 1.0 / 2.2, luma);
                var coverage: f32 = pow(shapeColor.a * alpha, gamma);

                return coverage;

            }
        `
    }
};
const mSDFBitGl = {
    name: "msdf-bit",
    fragment: {
        header: /* glsl */ `
            float calculateMSDFAlpha(vec4 msdfColor, vec4 shapeColor, float distance) {

                // MSDF
                float median = msdfColor.r + msdfColor.g + msdfColor.b -
                                min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                                max(msdfColor.r, max(msdfColor.g, msdfColor.b));

                // SDF
                median = min(median, msdfColor.a);

                float screenPxDistance = distance * (median - 0.5);
                float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);

                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                float luma = dot(shapeColor.rgb, vec3(0.299, 0.587, 0.114));
                float gamma = mix(1.0, 1.0 / 2.2, luma);
                float coverage = pow(shapeColor.a * alpha, gamma);

                return coverage;
            }
        `
    }
};
;
 //# sourceMappingURL=mSDFBit.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/sdfShader/SdfShader.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SdfShader",
    ()=>SdfShader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compileHighShaderToProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$colorBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/colorBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$generateTextureBatchBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/generateTextureBatchBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/roundPixelsBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$getBatchSamplersUniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/getBatchSamplersUniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$sdfShader$2f$shader$2d$bits$2f$localUniformMSDFBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/sdfShader/shader-bits/localUniformMSDFBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$sdfShader$2f$shader$2d$bits$2f$mSDFBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/sdfShader/shader-bits/mSDFBit.mjs [app-ssr] (ecmascript)");
;
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
let gpuProgram;
let glProgram;
class SdfShader extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Shader"] {
    constructor(maxTextures){
        const uniforms = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
            uColor: {
                value: new Float32Array([
                    1,
                    1,
                    1,
                    1
                ]),
                type: "vec4<f32>"
            },
            uTransformMatrix: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            uDistance: {
                value: 4,
                type: "f32"
            },
            uRound: {
                value: 0,
                type: "f32"
            }
        });
        gpuProgram ?? (gpuProgram = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compileHighShaderGpuProgram"])({
            name: "sdf-shader",
            bits: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$colorBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["colorBit"],
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$generateTextureBatchBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateTextureBatchBit"])(maxTextures),
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$sdfShader$2f$shader$2d$bits$2f$localUniformMSDFBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["localUniformMSDFBit"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$sdfShader$2f$shader$2d$bits$2f$mSDFBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mSDFBit"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roundPixelsBit"]
            ]
        }));
        glProgram ?? (glProgram = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compileHighShaderGlProgram"])({
            name: "sdf-shader",
            bits: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$colorBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["colorBitGl"],
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$generateTextureBatchBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateTextureBatchBitGl"])(maxTextures),
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$sdfShader$2f$shader$2d$bits$2f$localUniformMSDFBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["localUniformMSDFBitGl"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$sdfShader$2f$shader$2d$bits$2f$mSDFBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mSDFBitGl"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roundPixelsBitGl"]
            ]
        }));
        super({
            glProgram,
            gpuProgram,
            resources: {
                localUniforms: uniforms,
                batchSamplers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$getBatchSamplersUniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getBatchSamplersUniformGroup"])(maxTextures)
            }
        });
    }
}
;
 //# sourceMappingURL=SdfShader.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/BitmapTextPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BitmapTextGraphics",
    ()=>BitmapTextGraphics,
    "BitmapTextPipe",
    ()=>BitmapTextPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/cache/Cache.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$Graphics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/Graphics.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextMetrics.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$sdfShader$2f$SdfShader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/sdfShader/SdfShader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$BitmapFontManager$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/BitmapFontManager.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$utils$2f$getBitmapTextLayout$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/utils/getBitmapTextLayout.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
class BitmapTextGraphics extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$Graphics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Graphics"] {
    destroy() {
        if (this.context.customShader) {
            this.context.customShader.destroy();
        }
        super.destroy();
    }
}
class BitmapTextPipe {
    constructor(renderer){
        this._renderer = renderer;
    }
    validateRenderable(bitmapText) {
        const graphicsRenderable = this._getGpuBitmapText(bitmapText);
        return this._renderer.renderPipes.graphics.validateRenderable(graphicsRenderable);
    }
    addRenderable(bitmapText, instructionSet) {
        const graphicsRenderable = this._getGpuBitmapText(bitmapText);
        syncWithProxy(bitmapText, graphicsRenderable);
        if (bitmapText._didTextUpdate) {
            bitmapText._didTextUpdate = false;
            this._updateContext(bitmapText, graphicsRenderable);
        }
        this._renderer.renderPipes.graphics.addRenderable(graphicsRenderable, instructionSet);
        if (graphicsRenderable.context.customShader) {
            this._updateDistanceField(bitmapText);
        }
    }
    updateRenderable(bitmapText) {
        const graphicsRenderable = this._getGpuBitmapText(bitmapText);
        syncWithProxy(bitmapText, graphicsRenderable);
        this._renderer.renderPipes.graphics.updateRenderable(graphicsRenderable);
        if (graphicsRenderable.context.customShader) {
            this._updateDistanceField(bitmapText);
        }
    }
    _updateContext(bitmapText, proxyGraphics) {
        const { context } = proxyGraphics;
        const bitmapFont = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$BitmapFontManager$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BitmapFontManager"].getFont(bitmapText.text, bitmapText._style);
        context.clear();
        if (bitmapFont.distanceField.type !== "none") {
            if (!context.customShader) {
                context.customShader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$sdfShader$2f$SdfShader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SdfShader"](this._renderer.limits.maxBatchableTextures);
            }
        }
        const chars = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTextMetrics"].graphemeSegmenter(bitmapText.text);
        const style = bitmapText._style;
        let currentY = bitmapFont.baseLineOffset;
        const bitmapTextLayout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$utils$2f$getBitmapTextLayout$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getBitmapTextLayout"])(chars, style, bitmapFont, true);
        const padding = style.padding;
        const scale = bitmapTextLayout.scale;
        let tx = bitmapTextLayout.width;
        let ty = bitmapTextLayout.height + bitmapTextLayout.offsetY;
        if (style._stroke) {
            tx += style._stroke.width / scale;
            ty += style._stroke.width / scale;
        }
        context.translate(-bitmapText._anchor._x * tx - padding, -bitmapText._anchor._y * ty - padding).scale(scale, scale);
        const tint = bitmapFont.applyFillAsTint ? style._fill.color : 16777215;
        let fontSize = bitmapFont.fontMetrics.fontSize;
        let lineHeight = bitmapFont.lineHeight;
        if (style.lineHeight) {
            fontSize = style.fontSize / scale;
            lineHeight = style.lineHeight / scale;
        }
        let linePositionYShift = (lineHeight - fontSize) / 2;
        if (linePositionYShift - bitmapFont.baseLineOffset < 0) {
            linePositionYShift = 0;
        }
        for(let i = 0; i < bitmapTextLayout.lines.length; i++){
            const line = bitmapTextLayout.lines[i];
            for(let j = 0; j < line.charPositions.length; j++){
                const char = line.chars[j];
                const charData = bitmapFont.chars[char];
                if (charData?.texture) {
                    const texture = charData.texture;
                    context.texture(texture, tint ? tint : "black", Math.round(line.charPositions[j] + charData.xOffset), Math.round(currentY + charData.yOffset + linePositionYShift), texture.orig.width, texture.orig.height);
                }
            }
            currentY += lineHeight;
        }
    }
    _getGpuBitmapText(bitmapText) {
        return bitmapText._gpuData[this._renderer.uid] || this.initGpuText(bitmapText);
    }
    initGpuText(bitmapText) {
        const proxyRenderable = new BitmapTextGraphics();
        bitmapText._gpuData[this._renderer.uid] = proxyRenderable;
        this._updateContext(bitmapText, proxyRenderable);
        return proxyRenderable;
    }
    _updateDistanceField(bitmapText) {
        const context = this._getGpuBitmapText(bitmapText).context;
        const fontFamily = bitmapText._style.fontFamily;
        const dynamicFont = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].get(`${fontFamily}-bitmap`);
        const { a, b, c, d } = bitmapText.groupTransform;
        const dx = Math.sqrt(a * a + b * b);
        const dy = Math.sqrt(c * c + d * d);
        const worldScale = (Math.abs(dx) + Math.abs(dy)) / 2;
        const fontScale = dynamicFont.baseRenderedFontSize / bitmapText._style.fontSize;
        const distance = worldScale * dynamicFont.distanceField.range * (1 / fontScale);
        context.customShader.resources.localUniforms.uniforms.uDistance = distance;
    }
    destroy() {
        this._renderer = null;
    }
}
/** @ignore */ BitmapTextPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "bitmapText"
};
function syncWithProxy(container, proxy) {
    proxy.groupTransform = container.groupTransform;
    proxy.groupColorAlpha = container.groupColorAlpha;
    proxy.groupColor = container.groupColor;
    proxy.groupBlendMode = container.groupBlendMode;
    proxy.globalDisplayStatus = container.globalDisplayStatus;
    proxy.groupTransform = container.groupTransform;
    proxy.localDisplayStatus = container.localDisplayStatus;
    proxy.groupAlpha = container.groupAlpha;
    proxy._roundPixels = container._roundPixels;
}
;
 //# sourceMappingURL=BitmapTextPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/init.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$BitmapTextPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/BitmapTextPipe.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$BitmapTextPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BitmapTextPipe"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/BatchableHTMLText.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchableHTMLText",
    ()=>BatchableHTMLText
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/BatchableSprite.mjs [app-ssr] (ecmascript)");
;
"use strict";
class BatchableHTMLText extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableSprite"] {
    /**
   * Creates an instance of BatchableHTMLText.
   * @param renderer - The renderer instance to be used.
   */ constructor(renderer){
        super();
        this.generatingTexture = false;
        this.currentKey = "--";
        this._renderer = renderer;
        renderer.runners.resolutionChange.add(this);
    }
    /** Handles resolution changes for the HTML text. If the text has auto resolution enabled, it triggers a view update. */ resolutionChange() {
        const text = this.renderable;
        if (text._autoResolution) {
            text.onViewUpdate();
        }
    }
    /** Destroys the BatchableHTMLText instance. Returns the texture promise to the renderer and cleans up references. */ destroy() {
        const { htmlText } = this._renderer;
        htmlText.getReferenceCount(this.currentKey) === null ? htmlText.returnTexturePromise(this.texturePromise) : htmlText.decreaseReferenceCount(this.currentKey);
        this._renderer.runners.resolutionChange.remove(this);
        this.texturePromise = null;
        this._renderer = null;
    }
}
;
 //# sourceMappingURL=BatchableHTMLText.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/HTMLTextPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HTMLTextPipe",
    ()=>HTMLTextPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$utils$2f$updateTextBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/utils/updateTextBounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$BatchableHTMLText$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/BatchableHTMLText.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
class HTMLTextPipe {
    constructor(renderer){
        this._renderer = renderer;
    }
    validateRenderable(htmlText) {
        const gpuText = this._getGpuText(htmlText);
        const newKey = htmlText.styleKey;
        if (gpuText.currentKey !== newKey) {
            return true;
        }
        return false;
    }
    addRenderable(htmlText, instructionSet) {
        const batchableHTMLText = this._getGpuText(htmlText);
        if (htmlText._didTextUpdate) {
            const resolution = htmlText._autoResolution ? this._renderer.resolution : htmlText.resolution;
            if (batchableHTMLText.currentKey !== htmlText.styleKey || htmlText.resolution !== resolution) {
                this._updateGpuText(htmlText).catch((e)=>{
                    console.error(e);
                });
            }
            htmlText._didTextUpdate = false;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$utils$2f$updateTextBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateTextBounds"])(batchableHTMLText, htmlText);
        }
        this._renderer.renderPipes.batch.addToBatch(batchableHTMLText, instructionSet);
    }
    updateRenderable(htmlText) {
        const batchableHTMLText = this._getGpuText(htmlText);
        batchableHTMLText._batcher.updateElement(batchableHTMLText);
    }
    async _updateGpuText(htmlText) {
        htmlText._didTextUpdate = false;
        const batchableHTMLText = this._getGpuText(htmlText);
        if (batchableHTMLText.generatingTexture) return;
        const oldTexturePromise = batchableHTMLText.texturePromise;
        batchableHTMLText.texturePromise = null;
        batchableHTMLText.generatingTexture = true;
        htmlText._resolution = htmlText._autoResolution ? this._renderer.resolution : htmlText.resolution;
        let texturePromise = this._renderer.htmlText.getTexturePromise(htmlText);
        if (oldTexturePromise) {
            texturePromise = texturePromise.finally(()=>{
                this._renderer.htmlText.decreaseReferenceCount(batchableHTMLText.currentKey);
                this._renderer.htmlText.returnTexturePromise(oldTexturePromise);
            });
        }
        batchableHTMLText.texturePromise = texturePromise;
        batchableHTMLText.currentKey = htmlText.styleKey;
        batchableHTMLText.texture = await texturePromise;
        const renderGroup = htmlText.renderGroup || htmlText.parentRenderGroup;
        if (renderGroup) {
            renderGroup.structureDidChange = true;
        }
        batchableHTMLText.generatingTexture = false;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$utils$2f$updateTextBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateTextBounds"])(batchableHTMLText, htmlText);
    }
    _getGpuText(htmlText) {
        return htmlText._gpuData[this._renderer.uid] || this.initGpuText(htmlText);
    }
    initGpuText(htmlText) {
        const batchableHTMLText = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$BatchableHTMLText$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableHTMLText"](this._renderer);
        batchableHTMLText.renderable = htmlText;
        batchableHTMLText.transform = htmlText.groupTransform;
        batchableHTMLText.texture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY;
        batchableHTMLText.bounds = {
            minX: 0,
            maxX: 1,
            minY: 0,
            maxY: 0
        };
        batchableHTMLText.roundPixels = this._renderer._roundPixels | htmlText._roundPixels;
        htmlText._resolution = htmlText._autoResolution ? this._renderer.resolution : htmlText.resolution;
        htmlText._gpuData[this._renderer.uid] = batchableHTMLText;
        return batchableHTMLText;
    }
    destroy() {
        this._renderer = null;
    }
}
/** @ignore */ HTMLTextPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "htmlText"
};
;
 //# sourceMappingURL=HTMLTextPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/isSafari.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isSafari",
    ()=>isSafari
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
;
"use strict";
function isSafari() {
    const { userAgent } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getNavigator();
    return /^((?!chrome|android).)*safari/i.test(userAgent);
}
;
 //# sourceMappingURL=isSafari.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/HTMLTextRenderData.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HTMLTextRenderData",
    ()=>HTMLTextRenderData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
;
"use strict";
const nssvg = "http://www.w3.org/2000/svg";
const nsxhtml = "http://www.w3.org/1999/xhtml";
class HTMLTextRenderData {
    constructor(){
        this.svgRoot = document.createElementNS(nssvg, "svg");
        this.foreignObject = document.createElementNS(nssvg, "foreignObject");
        this.domElement = document.createElementNS(nsxhtml, "div");
        this.styleElement = document.createElementNS(nsxhtml, "style");
        const { foreignObject, svgRoot, styleElement, domElement } = this;
        foreignObject.setAttribute("width", "10000");
        foreignObject.setAttribute("height", "10000");
        foreignObject.style.overflow = "hidden";
        svgRoot.appendChild(foreignObject);
        foreignObject.appendChild(styleElement);
        foreignObject.appendChild(domElement);
        this.image = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createImage();
    }
    destroy() {
        this.svgRoot.remove();
        this.foreignObject.remove();
        this.styleElement.remove();
        this.domElement.remove();
        this.image.src = "";
        this.image.remove();
        this.svgRoot = null;
        this.foreignObject = null;
        this.styleElement = null;
        this.domElement = null;
        this.image = null;
        this.canvasAndContext = null;
    }
}
;
 //# sourceMappingURL=HTMLTextRenderData.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/extractFontFamilies.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extractFontFamilies",
    ()=>extractFontFamilies
]);
"use strict";
function extractFontFamilies(text, style) {
    const fontFamily = style.fontFamily;
    const fontFamilies = [];
    const dedupe = {};
    const regex = /font-family:([^;"\s]+)/g;
    const matches = text.match(regex);
    function addFontFamily(fontFamily2) {
        if (!dedupe[fontFamily2]) {
            fontFamilies.push(fontFamily2);
            dedupe[fontFamily2] = true;
        }
    }
    if (Array.isArray(fontFamily)) {
        for(let i = 0; i < fontFamily.length; i++){
            addFontFamily(fontFamily[i]);
        }
    } else {
        addFontFamily(fontFamily);
    }
    if (matches) {
        matches.forEach((match)=>{
            const fontFamily2 = match.split(":")[1].trim();
            addFontFamily(fontFamily2);
        });
    }
    for(const i in style.tagStyles){
        const fontFamily2 = style.tagStyles[i].fontFamily;
        addFontFamily(fontFamily2);
    }
    return fontFamilies;
}
;
 //# sourceMappingURL=extractFontFamilies.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/loadFontAsBase64.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadFontAsBase64",
    ()=>loadFontAsBase64
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
;
"use strict";
async function loadFontAsBase64(url) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();
    const dataSrc = await new Promise((resolve, reject)=>{
        reader.onloadend = ()=>resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
    return dataSrc;
}
;
 //# sourceMappingURL=loadFontAsBase64.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/loadFontCSS.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadFontCSS",
    ()=>loadFontCSS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$loadFontAsBase64$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/loadFontAsBase64.mjs [app-ssr] (ecmascript)");
;
"use strict";
async function loadFontCSS(style, url) {
    const dataSrc = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$loadFontAsBase64$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadFontAsBase64"])(url);
    return `@font-face {
        font-family: "${style.fontFamily}";
        font-weight: ${style.fontWeight};
        font-style: ${style.fontStyle};
        src: url('${dataSrc}');
    }`;
}
;
 //# sourceMappingURL=loadFontCSS.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/getFontCss.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FontStylePromiseCache",
    ()=>FontStylePromiseCache,
    "getFontCss",
    ()=>getFontCss
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/cache/Cache.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$loadFontCSS$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/loadFontCSS.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
const FontStylePromiseCache = /* @__PURE__ */ new Map();
async function getFontCss(fontFamilies) {
    const fontPromises = fontFamilies.filter((fontFamily)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].has(`${fontFamily}-and-url`)).map((fontFamily)=>{
        if (!FontStylePromiseCache.has(fontFamily)) {
            const { entries } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cache"].get(`${fontFamily}-and-url`);
            const promises = [];
            entries.forEach((entry)=>{
                const url = entry.url;
                const faces = entry.faces;
                const out = faces.map((face)=>({
                        weight: face.weight,
                        style: face.style
                    }));
                promises.push(...out.map((style)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$loadFontCSS$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadFontCSS"])({
                        fontWeight: style.weight,
                        fontStyle: style.style,
                        fontFamily
                    }, url)));
            });
            FontStylePromiseCache.set(fontFamily, Promise.all(promises).then((css)=>css.join("\n")));
        }
        return FontStylePromiseCache.get(fontFamily);
    });
    return (await Promise.all(fontPromises)).join("\n");
}
;
 //# sourceMappingURL=getFontCss.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/getSVGUrl.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSVGUrl",
    ()=>getSVGUrl
]);
"use strict";
function getSVGUrl(text, style, resolution, fontCSS, htmlTextData) {
    const { domElement, styleElement, svgRoot } = htmlTextData;
    domElement.innerHTML = `<style>${style.cssStyle}</style><div style='padding:0;'>${text}</div>`;
    domElement.setAttribute("style", `transform: scale(${resolution});transform-origin: top left; display: inline-block`);
    styleElement.textContent = fontCSS;
    const { width, height } = htmlTextData.image;
    svgRoot.setAttribute("width", width.toString());
    svgRoot.setAttribute("height", height.toString());
    return new XMLSerializer().serializeToString(svgRoot);
}
;
 //# sourceMappingURL=getSVGUrl.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/getTemporaryCanvasFromImage.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTemporaryCanvasFromImage",
    ()=>getTemporaryCanvasFromImage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/CanvasPool.mjs [app-ssr] (ecmascript)");
;
"use strict";
function getTemporaryCanvasFromImage(image, resolution) {
    const canvasAndContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasPool"].getOptimalCanvasAndContext(image.width, image.height, resolution);
    const { context } = canvasAndContext;
    context.clearRect(0, 0, image.width, image.height);
    context.drawImage(image, 0, 0);
    return canvasAndContext;
}
;
 //# sourceMappingURL=getTemporaryCanvasFromImage.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/loadSVGImage.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadSVGImage",
    ()=>loadSVGImage
]);
"use strict";
function loadSVGImage(image, url, delay) {
    return new Promise(async (resolve)=>{
        if (delay) {
            await new Promise((resolve2)=>setTimeout(resolve2, 100));
        }
        image.onload = ()=>{
            resolve();
        };
        image.src = `data:image/svg+xml;charset=utf8,${encodeURIComponent(url)}`;
        image.crossOrigin = "anonymous";
    });
}
;
 //# sourceMappingURL=loadSVGImage.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/measureHtmlText.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "measureHtmlText",
    ()=>measureHtmlText
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$HTMLTextRenderData$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/HTMLTextRenderData.mjs [app-ssr] (ecmascript)");
;
"use strict";
let tempHTMLTextRenderData;
function measureHtmlText(text, style, fontStyleCSS, htmlTextRenderData) {
    htmlTextRenderData || (htmlTextRenderData = tempHTMLTextRenderData || (tempHTMLTextRenderData = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$HTMLTextRenderData$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HTMLTextRenderData"]()));
    const { domElement, styleElement, svgRoot } = htmlTextRenderData;
    domElement.innerHTML = `<style>${style.cssStyle};</style><div style='padding:0'>${text}</div>`;
    domElement.setAttribute("style", "transform-origin: top left; display: inline-block");
    if (fontStyleCSS) {
        styleElement.textContent = fontStyleCSS;
    }
    document.body.appendChild(svgRoot);
    const contentBounds = domElement.getBoundingClientRect();
    svgRoot.remove();
    const doublePadding = style.padding * 2;
    return {
        width: contentBounds.width - doublePadding,
        height: contentBounds.height - doublePadding
    };
}
;
 //# sourceMappingURL=measureHtmlText.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/HTMLTextSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HTMLTextSystem",
    ()=>HTMLTextSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/CanvasPool.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TexturePool.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$isSafari$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/isSafari.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$utils$2f$getPo2TextureFromSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/utils/getPo2TextureFromSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$HTMLTextRenderData$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/HTMLTextRenderData.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$extractFontFamilies$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/extractFontFamilies.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$getFontCss$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/getFontCss.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$getSVGUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/getSVGUrl.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$getTemporaryCanvasFromImage$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/getTemporaryCanvasFromImage.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$loadSVGImage$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/loadSVGImage.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$measureHtmlText$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/utils/measureHtmlText.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
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
class HTMLTextSystem {
    constructor(renderer){
        this._activeTextures = {};
        this._renderer = renderer;
        this._createCanvas = renderer.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererType"].WEBGPU;
    }
    /**
   * @param options
   * @deprecated Use getTexturePromise instead
   */ getTexture(options) {
        return this.getTexturePromise(options);
    }
    /**
   * Increases the reference count for a texture.
   * @param text - The HTMLText instance associated with the texture.
   */ getManagedTexture(text) {
        const textKey = text.styleKey;
        if (this._activeTextures[textKey]) {
            this._increaseReferenceCount(textKey);
            return this._activeTextures[textKey].promise;
        }
        const promise = this._buildTexturePromise(text).then((texture)=>{
            this._activeTextures[textKey].texture = texture;
            return texture;
        });
        this._activeTextures[textKey] = {
            texture: null,
            promise,
            usageCount: 1
        };
        return promise;
    }
    /**
   * Gets the current reference count for a texture associated with a text key.
   * @param textKey - The unique key identifying the text style configuration
   * @returns The number of Text instances currently using this texture
   */ getReferenceCount(textKey) {
        return this._activeTextures[textKey]?.usageCount ?? null;
    }
    _increaseReferenceCount(textKey) {
        this._activeTextures[textKey].usageCount++;
    }
    /**
   * Decreases the reference count for a texture.
   * If the count reaches zero, the texture is cleaned up.
   * @param textKey - The key associated with the HTMLText instance.
   */ decreaseReferenceCount(textKey) {
        const activeTexture = this._activeTextures[textKey];
        if (!activeTexture) return;
        activeTexture.usageCount--;
        if (activeTexture.usageCount === 0) {
            if (activeTexture.texture) {
                this._cleanUp(activeTexture.texture);
            } else {
                activeTexture.promise.then((texture)=>{
                    activeTexture.texture = texture;
                    this._cleanUp(activeTexture.texture);
                }).catch(()=>{
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("HTMLTextSystem: Failed to clean texture");
                });
            }
            this._activeTextures[textKey] = null;
        }
    }
    /**
   * Returns a promise that resolves to a texture for the given HTMLText options.
   * @param options - The options for the HTMLText.
   * @returns A promise that resolves to a Texture.
   */ getTexturePromise(options) {
        return this._buildTexturePromise(options);
    }
    async _buildTexturePromise(options) {
        const { text, style, resolution, textureStyle } = options;
        const htmlTextData = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].get(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$HTMLTextRenderData$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HTMLTextRenderData"]);
        const fontFamilies = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$extractFontFamilies$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extractFontFamilies"])(text, style);
        const fontCSS = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$getFontCss$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getFontCss"])(fontFamilies);
        const measured = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$measureHtmlText$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["measureHtmlText"])(text, style, fontCSS, htmlTextData);
        const width = Math.ceil(Math.ceil(Math.max(1, measured.width) + style.padding * 2) * resolution);
        const height = Math.ceil(Math.ceil(Math.max(1, measured.height) + style.padding * 2) * resolution);
        const image = htmlTextData.image;
        const uvSafeOffset = 2;
        image.width = (width | 0) + uvSafeOffset;
        image.height = (height | 0) + uvSafeOffset;
        const svgURL = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$getSVGUrl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSVGUrl"])(text, style, resolution, fontCSS, htmlTextData);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$loadSVGImage$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadSVGImage"])(image, svgURL, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$isSafari$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isSafari"])() && fontFamilies.length > 0);
        const resource = image;
        let canvasAndContext;
        if (this._createCanvas) {
            canvasAndContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$utils$2f$getTemporaryCanvasFromImage$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTemporaryCanvasFromImage"])(image, resolution);
        }
        const texture = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$utils$2f$getPo2TextureFromSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPo2TextureFromSource"])(canvasAndContext ? canvasAndContext.canvas : resource, image.width - uvSafeOffset, image.height - uvSafeOffset, resolution);
        if (textureStyle) texture.source.style = textureStyle;
        if (this._createCanvas) {
            this._renderer.texture.initSource(texture.source);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasPool"].returnCanvasAndContext(canvasAndContext);
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].return(htmlTextData);
        return texture;
    }
    returnTexturePromise(texturePromise) {
        texturePromise.then((texture)=>{
            this._cleanUp(texture);
        }).catch(()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("HTMLTextSystem: Failed to clean texture");
        });
    }
    _cleanUp(texture) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(texture, true);
        texture.source.resource = null;
        texture.source.uploadMethodId = "unknown";
    }
    destroy() {
        this._renderer = null;
        for(const key in this._activeTextures){
            if (this._activeTextures[key]) this.returnTexturePromise(this._activeTextures[key].promise);
        }
        this._activeTextures = null;
    }
}
/** @ignore */ HTMLTextSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "htmlText"
};
;
 //# sourceMappingURL=HTMLTextSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/init.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$HTMLTextPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/HTMLTextPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$HTMLTextSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/HTMLTextSystem.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$HTMLTextSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HTMLTextSystem"]);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$HTMLTextPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HTMLTextPipe"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/shared/MeshGeometry.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MeshGeometry",
    ()=>MeshGeometry
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/Buffer.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$Geometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/Geometry.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
const _MeshGeometry = class _MeshGeometry extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$Geometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Geometry"] {
    constructor(...args){
        let options = args[0] ?? {};
        if (options instanceof Float32Array) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "use new MeshGeometry({ positions, uvs, indices }) instead");
            options = {
                positions: options,
                uvs: args[1],
                indices: args[2]
            };
        }
        options = {
            ..._MeshGeometry.defaultOptions,
            ...options
        };
        const positions = options.positions || new Float32Array([
            0,
            0,
            1,
            0,
            1,
            1,
            0,
            1
        ]);
        let uvs = options.uvs;
        if (!uvs) {
            if (options.positions) {
                uvs = new Float32Array(positions.length);
            } else {
                uvs = new Float32Array([
                    0,
                    0,
                    1,
                    0,
                    1,
                    1,
                    0,
                    1
                ]);
            }
        }
        const indices = options.indices || new Uint32Array([
            0,
            1,
            2,
            0,
            2,
            3
        ]);
        const shrinkToFit = options.shrinkBuffersToFit;
        const positionBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Buffer"]({
            data: positions,
            label: "attribute-mesh-positions",
            shrinkToFit,
            usage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].VERTEX | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST
        });
        const uvBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Buffer"]({
            data: uvs,
            label: "attribute-mesh-uvs",
            shrinkToFit,
            usage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].VERTEX | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST
        });
        const indexBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Buffer"]({
            data: indices,
            label: "index-mesh-buffer",
            shrinkToFit,
            usage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].INDEX | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST
        });
        super({
            attributes: {
                aPosition: {
                    buffer: positionBuffer,
                    format: "float32x2",
                    stride: 2 * 4,
                    offset: 0
                },
                aUV: {
                    buffer: uvBuffer,
                    format: "float32x2",
                    stride: 2 * 4,
                    offset: 0
                }
            },
            indexBuffer,
            topology: options.topology
        });
        this.batchMode = "auto";
    }
    /** The positions of the mesh. */ get positions() {
        return this.attributes.aPosition.buffer.data;
    }
    /**
   * Set the positions of the mesh.
   * When setting the positions, its important that the uvs array is at least as long as the positions array.
   * otherwise the geometry will not be valid.
   * @param {Float32Array} value - The positions of the mesh.
   */ set positions(value) {
        this.attributes.aPosition.buffer.data = value;
    }
    /** The UVs of the mesh. */ get uvs() {
        return this.attributes.aUV.buffer.data;
    }
    /**
   * Set the UVs of the mesh.
   * Its important that the uvs array you set is at least as long as the positions array.
   * otherwise the geometry will not be valid.
   * @param {Float32Array} value - The UVs of the mesh.
   */ set uvs(value) {
        this.attributes.aUV.buffer.data = value;
    }
    /** The indices of the mesh. */ get indices() {
        return this.indexBuffer.data;
    }
    set indices(value) {
        this.indexBuffer.data = value;
    }
};
_MeshGeometry.defaultOptions = {
    topology: "triangle-list",
    shrinkBuffersToFit: false
};
let MeshGeometry = _MeshGeometry;
;
 //# sourceMappingURL=MeshGeometry.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/localUniformBit.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "localUniformBit",
    ()=>localUniformBit,
    "localUniformBitGl",
    ()=>localUniformBitGl,
    "localUniformBitGroup2",
    ()=>localUniformBitGroup2
]);
"use strict";
const localUniformBit = {
    name: "local-uniform-bit",
    vertex: {
        header: /* wgsl */ `

            struct LocalUniforms {
                uTransformMatrix:mat3x3<f32>,
                uColor:vec4<f32>,
                uRound:f32,
            }

            @group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `,
        main: /* wgsl */ `
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `,
        end: /* wgsl */ `
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `
    }
};
const localUniformBitGroup2 = {
    ...localUniformBit,
    vertex: {
        ...localUniformBit.vertex,
        // replace the group!
        header: localUniformBit.vertex.header.replace("group(1)", "group(2)")
    }
};
const localUniformBitGl = {
    name: "local-uniform-bit",
    vertex: {
        header: /* glsl */ `

            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `,
        main: /* glsl */ `
            vColor *= uColor;
            modelMatrix = uTransformMatrix;
        `,
        end: /* glsl */ `
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `
    }
};
;
 //# sourceMappingURL=localUniformBit.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/shader/tilingBit.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "tilingBit",
    ()=>tilingBit,
    "tilingBitGl",
    ()=>tilingBitGl
]);
"use strict";
const tilingBit = {
    name: "tiling-bit",
    vertex: {
        header: /* wgsl */ `
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `,
        main: /* wgsl */ `
            uv = (tilingUniforms.uTextureTransform * vec3(uv, 1.0)).xy;

            position = (position - tilingUniforms.uSizeAnchor.zw) * tilingUniforms.uSizeAnchor.xy;
        `
    },
    fragment: {
        header: /* wgsl */ `
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `,
        main: /* wgsl */ `

            var coord = vUV + ceil(tilingUniforms.uClampOffset - vUV);
            coord = (tilingUniforms.uMapCoord * vec3(coord, 1.0)).xy;
            var unclamped = coord;
            coord = clamp(coord, tilingUniforms.uClampFrame.xy, tilingUniforms.uClampFrame.zw);

            var bias = 0.;

            if(unclamped.x == coord.x && unclamped.y == coord.y)
            {
                bias = -32.;
            }

            outColor = textureSampleBias(uTexture, uSampler, coord, bias);
        `
    }
};
const tilingBitGl = {
    name: "tiling-bit",
    vertex: {
        header: /* glsl */ `
            uniform mat3 uTextureTransform;
            uniform vec4 uSizeAnchor;

        `,
        main: /* glsl */ `
            uv = (uTextureTransform * vec3(aUV, 1.0)).xy;

            position = (position - uSizeAnchor.zw) * uSizeAnchor.xy;
        `
    },
    fragment: {
        header: /* glsl */ `
            uniform sampler2D uTexture;
            uniform mat3 uMapCoord;
            uniform vec4 uClampFrame;
            uniform vec2 uClampOffset;
        `,
        main: /* glsl */ `

        vec2 coord = vUV + ceil(uClampOffset - vUV);
        coord = (uMapCoord * vec3(coord, 1.0)).xy;
        vec2 unclamped = coord;
        coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);

        outColor = texture(uTexture, coord, unclamped == coord ? 0.0 : -32.0);// lod-bias very negative to force lod 0

        `
    }
};
;
 //# sourceMappingURL=tilingBit.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/shader/TilingSpriteShader.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TilingSpriteShader",
    ()=>TilingSpriteShader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compileHighShaderToProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$localUniformBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/localUniformBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/roundPixelsBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$shader$2f$tilingBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/shader/tilingBit.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
"use strict";
let gpuProgram;
let glProgram;
class TilingSpriteShader extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Shader"] {
    constructor(){
        gpuProgram ?? (gpuProgram = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compileHighShaderGpuProgram"])({
            name: "tiling-sprite-shader",
            bits: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$localUniformBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["localUniformBit"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$shader$2f$tilingBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tilingBit"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roundPixelsBit"]
            ]
        }));
        glProgram ?? (glProgram = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compileHighShaderGlProgram"])({
            name: "tiling-sprite-shader",
            bits: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$localUniformBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["localUniformBitGl"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$shader$2f$tilingBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tilingBitGl"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roundPixelsBitGl"]
            ]
        }));
        const tilingUniforms = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
            uMapCoord: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            uClampFrame: {
                value: new Float32Array([
                    0,
                    0,
                    1,
                    1
                ]),
                type: "vec4<f32>"
            },
            uClampOffset: {
                value: new Float32Array([
                    0,
                    0
                ]),
                type: "vec2<f32>"
            },
            uTextureTransform: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            uSizeAnchor: {
                value: new Float32Array([
                    100,
                    100,
                    0.5,
                    0.5
                ]),
                type: "vec4<f32>"
            }
        });
        super({
            glProgram,
            gpuProgram,
            resources: {
                localUniforms: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
                    uTransformMatrix: {
                        value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                        type: "mat3x3<f32>"
                    },
                    uColor: {
                        value: new Float32Array([
                            1,
                            1,
                            1,
                            1
                        ]),
                        type: "vec4<f32>"
                    },
                    uRound: {
                        value: 0,
                        type: "f32"
                    }
                }),
                tilingUniforms,
                uTexture: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY.source,
                uSampler: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY.source.style
            }
        });
    }
    updateUniforms(width, height, matrix, anchorX, anchorY, texture) {
        const tilingUniforms = this.resources.tilingUniforms;
        const textureWidth = texture.width;
        const textureHeight = texture.height;
        const textureMatrix = texture.textureMatrix;
        const uTextureTransform = tilingUniforms.uniforms.uTextureTransform;
        uTextureTransform.set(matrix.a * textureWidth / width, matrix.b * textureWidth / height, matrix.c * textureHeight / width, matrix.d * textureHeight / height, matrix.tx / width, matrix.ty / height);
        uTextureTransform.invert();
        tilingUniforms.uniforms.uMapCoord = textureMatrix.mapCoord;
        tilingUniforms.uniforms.uClampFrame = textureMatrix.uClampFrame;
        tilingUniforms.uniforms.uClampOffset = textureMatrix.uClampOffset;
        tilingUniforms.uniforms.uTextureTransform = uTextureTransform;
        tilingUniforms.uniforms.uSizeAnchor[0] = width;
        tilingUniforms.uniforms.uSizeAnchor[1] = height;
        tilingUniforms.uniforms.uSizeAnchor[2] = anchorX;
        tilingUniforms.uniforms.uSizeAnchor[3] = anchorY;
        if (texture) {
            this.resources.uTexture = texture.source;
            this.resources.uSampler = texture.source.style;
        }
    }
}
;
 //# sourceMappingURL=TilingSpriteShader.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/utils/QuadGeometry.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "QuadGeometry",
    ()=>QuadGeometry
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$MeshGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/shared/MeshGeometry.mjs [app-ssr] (ecmascript)");
;
"use strict";
class QuadGeometry extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$MeshGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshGeometry"] {
    constructor(){
        super({
            positions: new Float32Array([
                0,
                0,
                1,
                0,
                1,
                1,
                0,
                1
            ]),
            uvs: new Float32Array([
                0,
                0,
                1,
                0,
                1,
                1,
                0,
                1
            ]),
            indices: new Uint32Array([
                0,
                1,
                2,
                0,
                2,
                3
            ])
        });
    }
}
;
 //# sourceMappingURL=QuadGeometry.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/utils/setPositions.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "setPositions",
    ()=>setPositions
]);
"use strict";
function setPositions(tilingSprite, positions) {
    const anchorX = tilingSprite.anchor.x;
    const anchorY = tilingSprite.anchor.y;
    positions[0] = -anchorX * tilingSprite.width;
    positions[1] = -anchorY * tilingSprite.height;
    positions[2] = (1 - anchorX) * tilingSprite.width;
    positions[3] = -anchorY * tilingSprite.height;
    positions[4] = (1 - anchorX) * tilingSprite.width;
    positions[5] = (1 - anchorY) * tilingSprite.height;
    positions[6] = -anchorX * tilingSprite.width;
    positions[7] = (1 - anchorY) * tilingSprite.height;
}
;
 //# sourceMappingURL=setPositions.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/utils/applyMatrix.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyMatrix",
    ()=>applyMatrix
]);
"use strict";
function applyMatrix(array, stride, offset, matrix) {
    let index = 0;
    const size = array.length / (stride || 2);
    const a = matrix.a;
    const b = matrix.b;
    const c = matrix.c;
    const d = matrix.d;
    const tx = matrix.tx;
    const ty = matrix.ty;
    offset *= stride;
    while(index < size){
        const x = array[offset];
        const y = array[offset + 1];
        array[offset] = a * x + c * y + tx;
        array[offset + 1] = b * x + d * y + ty;
        offset += stride;
        index++;
    }
}
;
 //# sourceMappingURL=applyMatrix.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/utils/setUvs.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "setUvs",
    ()=>setUvs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$utils$2f$applyMatrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/utils/applyMatrix.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
function setUvs(tilingSprite, uvs) {
    const texture = tilingSprite.texture;
    const width = texture.frame.width;
    const height = texture.frame.height;
    let anchorX = 0;
    let anchorY = 0;
    if (tilingSprite.applyAnchorToTexture) {
        anchorX = tilingSprite.anchor.x;
        anchorY = tilingSprite.anchor.y;
    }
    uvs[0] = uvs[6] = -anchorX;
    uvs[2] = uvs[4] = 1 - anchorX;
    uvs[1] = uvs[3] = -anchorY;
    uvs[5] = uvs[7] = 1 - anchorY;
    const textureMatrix = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"].shared;
    textureMatrix.copyFrom(tilingSprite._tileTransform.matrix);
    textureMatrix.tx /= tilingSprite.width;
    textureMatrix.ty /= tilingSprite.height;
    textureMatrix.invert();
    textureMatrix.scale(tilingSprite.width / width, tilingSprite.height / height);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$utils$2f$applyMatrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["applyMatrix"])(uvs, 2, 0, textureMatrix);
}
;
 //# sourceMappingURL=setUvs.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/TilingSpritePipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TilingSpriteGpuData",
    ()=>TilingSpriteGpuData,
    "TilingSpritePipe",
    ()=>TilingSpritePipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$getAdjustedBlendModeBlend$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/getAdjustedBlendModeBlend.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gpu/colorToUniform.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$BatchableMesh$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/shared/BatchableMesh.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$MeshGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/shared/MeshGeometry.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$shader$2f$TilingSpriteShader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/shader/TilingSpriteShader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$utils$2f$QuadGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/utils/QuadGeometry.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$utils$2f$setPositions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/utils/setPositions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$utils$2f$setUvs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/utils/setUvs.mjs [app-ssr] (ecmascript)");
;
;
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
const sharedQuad = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$utils$2f$QuadGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QuadGeometry"]();
class TilingSpriteGpuData {
    constructor(){
        this.canBatch = true;
        this.geometry = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$MeshGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshGeometry"]({
            indices: sharedQuad.indices.slice(),
            positions: sharedQuad.positions.slice(),
            uvs: sharedQuad.uvs.slice()
        });
    }
    destroy() {
        this.geometry.destroy();
        this.shader?.destroy();
    }
}
class TilingSpritePipe {
    constructor(renderer){
        this._state = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].default2d;
        this._renderer = renderer;
    }
    validateRenderable(renderable) {
        const tilingSpriteData = this._getTilingSpriteData(renderable);
        const couldBatch = tilingSpriteData.canBatch;
        this._updateCanBatch(renderable);
        const canBatch = tilingSpriteData.canBatch;
        if (canBatch && canBatch === couldBatch) {
            const { batchableMesh } = tilingSpriteData;
            return !batchableMesh._batcher.checkAndUpdateTexture(batchableMesh, renderable.texture);
        }
        return couldBatch !== canBatch;
    }
    addRenderable(tilingSprite, instructionSet) {
        const batcher = this._renderer.renderPipes.batch;
        this._updateCanBatch(tilingSprite);
        const tilingSpriteData = this._getTilingSpriteData(tilingSprite);
        const { geometry, canBatch } = tilingSpriteData;
        if (canBatch) {
            tilingSpriteData.batchableMesh || (tilingSpriteData.batchableMesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$BatchableMesh$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableMesh"]());
            const batchableMesh = tilingSpriteData.batchableMesh;
            if (tilingSprite.didViewUpdate) {
                this._updateBatchableMesh(tilingSprite);
                batchableMesh.geometry = geometry;
                batchableMesh.renderable = tilingSprite;
                batchableMesh.transform = tilingSprite.groupTransform;
                batchableMesh.setTexture(tilingSprite._texture);
            }
            batchableMesh.roundPixels = this._renderer._roundPixels | tilingSprite._roundPixels;
            batcher.addToBatch(batchableMesh, instructionSet);
        } else {
            batcher.break(instructionSet);
            tilingSpriteData.shader || (tilingSpriteData.shader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$shader$2f$TilingSpriteShader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TilingSpriteShader"]());
            this.updateRenderable(tilingSprite);
            instructionSet.add(tilingSprite);
        }
    }
    execute(tilingSprite) {
        const { shader } = this._getTilingSpriteData(tilingSprite);
        shader.groups[0] = this._renderer.globalUniforms.bindGroup;
        const localUniforms = shader.resources.localUniforms.uniforms;
        localUniforms.uTransformMatrix = tilingSprite.groupTransform;
        localUniforms.uRound = this._renderer._roundPixels | tilingSprite._roundPixels;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["color32BitToUniform"])(tilingSprite.groupColorAlpha, localUniforms.uColor, 0);
        this._state.blendMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$getAdjustedBlendModeBlend$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAdjustedBlendModeBlend"])(tilingSprite.groupBlendMode, tilingSprite.texture._source);
        this._renderer.encoder.draw({
            geometry: sharedQuad,
            shader,
            state: this._state
        });
    }
    updateRenderable(tilingSprite) {
        const tilingSpriteData = this._getTilingSpriteData(tilingSprite);
        const { canBatch } = tilingSpriteData;
        if (canBatch) {
            const { batchableMesh } = tilingSpriteData;
            if (tilingSprite.didViewUpdate) this._updateBatchableMesh(tilingSprite);
            batchableMesh._batcher.updateElement(batchableMesh);
        } else if (tilingSprite.didViewUpdate) {
            const { shader } = tilingSpriteData;
            shader.updateUniforms(tilingSprite.width, tilingSprite.height, tilingSprite._tileTransform.matrix, tilingSprite.anchor.x, tilingSprite.anchor.y, tilingSprite.texture);
        }
    }
    _getTilingSpriteData(renderable) {
        return renderable._gpuData[this._renderer.uid] || this._initTilingSpriteData(renderable);
    }
    _initTilingSpriteData(tilingSprite) {
        const gpuData = new TilingSpriteGpuData();
        gpuData.renderable = tilingSprite;
        tilingSprite._gpuData[this._renderer.uid] = gpuData;
        return gpuData;
    }
    _updateBatchableMesh(tilingSprite) {
        const renderableData = this._getTilingSpriteData(tilingSprite);
        const { geometry } = renderableData;
        const style = tilingSprite.texture.source.style;
        if (style.addressMode !== "repeat") {
            style.addressMode = "repeat";
            style.update();
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$utils$2f$setUvs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setUvs"])(tilingSprite, geometry.uvs);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$utils$2f$setPositions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setPositions"])(tilingSprite, geometry.positions);
    }
    destroy() {
        this._renderer = null;
    }
    _updateCanBatch(tilingSprite) {
        const renderableData = this._getTilingSpriteData(tilingSprite);
        const texture = tilingSprite.texture;
        let _nonPowOf2wrapping = true;
        if (this._renderer.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererType"].WEBGL) {
            _nonPowOf2wrapping = this._renderer.context.supports.nonPowOf2wrapping;
        }
        renderableData.canBatch = texture.textureMatrix.isSimple && (_nonPowOf2wrapping || texture.source.isPowerOfTwo);
        return renderableData.canBatch;
    }
}
/** @ignore */ TilingSpritePipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "tilingSprite"
};
;
 //# sourceMappingURL=TilingSpritePipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/init.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$TilingSpritePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/TilingSpritePipe.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$TilingSpritePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TilingSpritePipe"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh-plane/PlaneGeometry.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PlaneGeometry",
    ()=>PlaneGeometry
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$MeshGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/shared/MeshGeometry.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
const _PlaneGeometry = class _PlaneGeometry extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$MeshGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshGeometry"] {
    constructor(...args){
        super({});
        let options = args[0] ?? {};
        if (typeof options === "number") {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "PlaneGeometry constructor changed please use { width, height, verticesX, verticesY } instead");
            options = {
                width: options,
                height: args[1],
                verticesX: args[2],
                verticesY: args[3]
            };
        }
        this.build(options);
    }
    /**
   * Refreshes plane coordinates
   * @param options - Options to be applied to plane geometry
   */ build(options) {
        options = {
            ..._PlaneGeometry.defaultOptions,
            ...options
        };
        this.verticesX = this.verticesX ?? options.verticesX;
        this.verticesY = this.verticesY ?? options.verticesY;
        this.width = this.width ?? options.width;
        this.height = this.height ?? options.height;
        const total = this.verticesX * this.verticesY;
        const verts = [];
        const uvs = [];
        const indices = [];
        const verticesX = this.verticesX - 1;
        const verticesY = this.verticesY - 1;
        const sizeX = this.width / verticesX;
        const sizeY = this.height / verticesY;
        for(let i = 0; i < total; i++){
            const x = i % this.verticesX;
            const y = i / this.verticesX | 0;
            verts.push(x * sizeX, y * sizeY);
            uvs.push(x / verticesX, y / verticesY);
        }
        const totalSub = verticesX * verticesY;
        for(let i = 0; i < totalSub; i++){
            const xpos = i % verticesX;
            const ypos = i / verticesX | 0;
            const value = ypos * this.verticesX + xpos;
            const value2 = ypos * this.verticesX + xpos + 1;
            const value3 = (ypos + 1) * this.verticesX + xpos;
            const value4 = (ypos + 1) * this.verticesX + xpos + 1;
            indices.push(value, value2, value3, value2, value4, value3);
        }
        this.buffers[0].data = new Float32Array(verts);
        this.buffers[1].data = new Float32Array(uvs);
        this.indexBuffer.data = new Uint32Array(indices);
        this.buffers[0].update();
        this.buffers[1].update();
        this.indexBuffer.update();
    }
};
_PlaneGeometry.defaultOptions = {
    width: 100,
    height: 100,
    verticesX: 10,
    verticesY: 10
};
let PlaneGeometry = _PlaneGeometry;
;
 //# sourceMappingURL=PlaneGeometry.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-nine-slice/NineSliceGeometry.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NineSliceGeometry",
    ()=>NineSliceGeometry
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2d$plane$2f$PlaneGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh-plane/PlaneGeometry.mjs [app-ssr] (ecmascript)");
;
"use strict";
const _NineSliceGeometry = class _NineSliceGeometry extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2d$plane$2f$PlaneGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"] {
    constructor(options = {}){
        options = {
            ..._NineSliceGeometry.defaultOptions,
            ...options
        };
        super({
            width: options.width,
            height: options.height,
            verticesX: 4,
            verticesY: 4
        });
        this.update(options);
    }
    /**
   * Updates the NineSliceGeometry with the options.
   * @param options - The options of the NineSliceGeometry.
   */ update(options) {
        this.width = options.width ?? this.width;
        this.height = options.height ?? this.height;
        this._originalWidth = options.originalWidth ?? this._originalWidth;
        this._originalHeight = options.originalHeight ?? this._originalHeight;
        this._leftWidth = options.leftWidth ?? this._leftWidth;
        this._rightWidth = options.rightWidth ?? this._rightWidth;
        this._topHeight = options.topHeight ?? this._topHeight;
        this._bottomHeight = options.bottomHeight ?? this._bottomHeight;
        this._anchorX = options.anchor?.x;
        this._anchorY = options.anchor?.y;
        this.updateUvs();
        this.updatePositions();
    }
    /** Updates the positions of the vertices. */ updatePositions() {
        const p = this.positions;
        const { width, height, _leftWidth, _rightWidth, _topHeight, _bottomHeight, _anchorX, _anchorY } = this;
        const w = _leftWidth + _rightWidth;
        const scaleW = width > w ? 1 : width / w;
        const h = _topHeight + _bottomHeight;
        const scaleH = height > h ? 1 : height / h;
        const scale = Math.min(scaleW, scaleH);
        const anchorOffsetX = _anchorX * width;
        const anchorOffsetY = _anchorY * height;
        p[0] = p[8] = p[16] = p[24] = -anchorOffsetX;
        p[2] = p[10] = p[18] = p[26] = _leftWidth * scale - anchorOffsetX;
        p[4] = p[12] = p[20] = p[28] = width - _rightWidth * scale - anchorOffsetX;
        p[6] = p[14] = p[22] = p[30] = width - anchorOffsetX;
        p[1] = p[3] = p[5] = p[7] = -anchorOffsetY;
        p[9] = p[11] = p[13] = p[15] = _topHeight * scale - anchorOffsetY;
        p[17] = p[19] = p[21] = p[23] = height - _bottomHeight * scale - anchorOffsetY;
        p[25] = p[27] = p[29] = p[31] = height - anchorOffsetY;
        this.getBuffer("aPosition").update();
    }
    /** Updates the UVs of the vertices. */ updateUvs() {
        const uvs = this.uvs;
        uvs[0] = uvs[8] = uvs[16] = uvs[24] = 0;
        uvs[1] = uvs[3] = uvs[5] = uvs[7] = 0;
        uvs[6] = uvs[14] = uvs[22] = uvs[30] = 1;
        uvs[25] = uvs[27] = uvs[29] = uvs[31] = 1;
        const _uvw = 1 / this._originalWidth;
        const _uvh = 1 / this._originalHeight;
        uvs[2] = uvs[10] = uvs[18] = uvs[26] = _uvw * this._leftWidth;
        uvs[9] = uvs[11] = uvs[13] = uvs[15] = _uvh * this._topHeight;
        uvs[4] = uvs[12] = uvs[20] = uvs[28] = 1 - _uvw * this._rightWidth;
        uvs[17] = uvs[19] = uvs[21] = uvs[23] = 1 - _uvh * this._bottomHeight;
        this.getBuffer("aUV").update();
    }
};
/** The default options for the NineSliceGeometry. */ _NineSliceGeometry.defaultOptions = {
    /** The width of the NineSlicePlane, setting this will actually modify the vertices and UV's of this plane. */ width: 100,
    /** The height of the NineSlicePlane, setting this will actually modify the vertices and UV's of this plane. */ height: 100,
    /** The width of the left column. */ leftWidth: 10,
    /** The height of the top row. */ topHeight: 10,
    /** The width of the right column. */ rightWidth: 10,
    /** The height of the bottom row. */ bottomHeight: 10,
    /** The original width of the texture */ originalWidth: 100,
    /** The original height of the texture */ originalHeight: 100
};
let NineSliceGeometry = _NineSliceGeometry;
;
 //# sourceMappingURL=NineSliceGeometry.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-nine-slice/NineSliceSpritePipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NineSliceSpriteGpuData",
    ()=>NineSliceSpriteGpuData,
    "NineSliceSpritePipe",
    ()=>NineSliceSpritePipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$BatchableMesh$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/shared/BatchableMesh.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$nine$2d$slice$2f$NineSliceGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-nine-slice/NineSliceGeometry.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class NineSliceSpriteGpuData extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$shared$2f$BatchableMesh$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableMesh"] {
    constructor(){
        super();
        this.geometry = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$nine$2d$slice$2f$NineSliceGeometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NineSliceGeometry"]();
    }
    destroy() {
        this.geometry.destroy();
    }
}
class NineSliceSpritePipe {
    constructor(renderer){
        this._renderer = renderer;
    }
    addRenderable(sprite, instructionSet) {
        const gpuSprite = this._getGpuSprite(sprite);
        if (sprite.didViewUpdate) this._updateBatchableSprite(sprite, gpuSprite);
        this._renderer.renderPipes.batch.addToBatch(gpuSprite, instructionSet);
    }
    updateRenderable(sprite) {
        const gpuSprite = this._getGpuSprite(sprite);
        if (sprite.didViewUpdate) this._updateBatchableSprite(sprite, gpuSprite);
        gpuSprite._batcher.updateElement(gpuSprite);
    }
    validateRenderable(sprite) {
        const gpuSprite = this._getGpuSprite(sprite);
        return !gpuSprite._batcher.checkAndUpdateTexture(gpuSprite, sprite._texture);
    }
    _updateBatchableSprite(sprite, batchableSprite) {
        batchableSprite.geometry.update(sprite);
        batchableSprite.setTexture(sprite._texture);
    }
    _getGpuSprite(sprite) {
        return sprite._gpuData[this._renderer.uid] || this._initGPUSprite(sprite);
    }
    _initGPUSprite(sprite) {
        const gpuData = sprite._gpuData[this._renderer.uid] = new NineSliceSpriteGpuData();
        const batchableMesh = gpuData;
        batchableMesh.renderable = sprite;
        batchableMesh.transform = sprite.groupTransform;
        batchableMesh.texture = sprite._texture;
        batchableMesh.roundPixels = this._renderer._roundPixels | sprite._roundPixels;
        if (!sprite.didViewUpdate) {
            this._updateBatchableSprite(sprite, batchableMesh);
        }
        return gpuData;
    }
    destroy() {
        this._renderer = null;
    }
}
/** @ignore */ NineSliceSpritePipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "nineSliceSprite"
};
;
 //# sourceMappingURL=NineSliceSpritePipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-nine-slice/init.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$nine$2d$slice$2f$NineSliceSpritePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-nine-slice/NineSliceSpritePipe.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$nine$2d$slice$2f$NineSliceSpritePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NineSliceSpritePipe"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/FilterPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FilterPipe",
    ()=>FilterPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class FilterPipe {
    constructor(renderer){
        this._renderer = renderer;
    }
    push(filterEffect, container, instructionSet) {
        const renderPipes = this._renderer.renderPipes;
        renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "filter",
            canBundle: false,
            action: "pushFilter",
            container,
            filterEffect
        });
    }
    pop(_filterEffect, _container, instructionSet) {
        this._renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "filter",
            action: "popFilter",
            canBundle: false
        });
    }
    execute(instruction) {
        if (instruction.action === "pushFilter") {
            this._renderer.filter.push(instruction);
        } else if (instruction.action === "popFilter") {
            this._renderer.filter.pop();
        }
    }
    destroy() {
        this._renderer = null;
    }
}
FilterPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "filter"
};
;
 //# sourceMappingURL=FilterPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getRenderableBounds.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getGlobalRenderableBounds",
    ()=>getGlobalRenderableBounds
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
const tempProjectionMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"]();
function getGlobalRenderableBounds(renderables, bounds) {
    bounds.clear();
    const actualMatrix = bounds.matrix;
    for(let i = 0; i < renderables.length; i++){
        const renderable = renderables[i];
        if (renderable.globalDisplayStatus < 7) {
            continue;
        }
        const renderGroup = renderable.renderGroup ?? renderable.parentRenderGroup;
        if (renderGroup?.isCachedAsTexture) {
            bounds.matrix = tempProjectionMatrix.copyFrom(renderGroup.textureOffsetInverseTransform).append(renderable.worldTransform);
        } else if (renderGroup?._parentCacheAsTextureRenderGroup) {
            bounds.matrix = tempProjectionMatrix.copyFrom(renderGroup._parentCacheAsTextureRenderGroup.inverseWorldTransform).append(renderable.groupTransform);
        } else {
            bounds.matrix = renderable.worldTransform;
        }
        bounds.addBounds(renderable.bounds);
    }
    bounds.matrix = actualMatrix;
    return bounds;
}
;
 //# sourceMappingURL=getRenderableBounds.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/FilterSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FilterSystem",
    ()=>FilterSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/BindGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$Geometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/Geometry.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TexturePool.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getRenderableBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getRenderableBounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
;
;
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
const quadGeometry = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$Geometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Geometry"]({
    attributes: {
        aPosition: {
            buffer: new Float32Array([
                0,
                0,
                1,
                0,
                1,
                1,
                0,
                1
            ]),
            format: "float32x2",
            stride: 2 * 4,
            offset: 0
        }
    },
    indexBuffer: new Uint32Array([
        0,
        1,
        2,
        0,
        2,
        3
    ])
});
class FilterData {
    constructor(){
        /**
     * Indicates whether the filter should be skipped.
     * @type {boolean}
     */ this.skip = false;
        /**
     * The texture to which the filter is applied.
     * @type {Texture}
     */ this.inputTexture = null;
        /**
     * The back texture used for blending, if required.
     * @type {Texture | null}
     */ this.backTexture = null;
        /**
     * The list of filters to be applied.
     * @type {Filter[]}
     */ this.filters = null;
        /**
     * The bounds of the filter area.
     * @type {Bounds}
     */ this.bounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bounds"]();
        /**
     * The container to which the filter is applied.
     * @type {Container}
     */ this.container = null;
        /**
     * Indicates whether blending is required for the filter.
     * @type {boolean}
     */ this.blendRequired = false;
        /**
     * The render surface where the output of the filter is rendered.
     * @type {RenderSurface}
     */ this.outputRenderSurface = null;
        /**
     * The global frame of the filter area.
     * @type {{ x: number, y: number, width: number, height: number }}
     */ this.globalFrame = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
    }
}
class FilterSystem {
    constructor(renderer){
        this._filterStackIndex = 0;
        this._filterStack = [];
        this._filterGlobalUniforms = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
            uInputSize: {
                value: new Float32Array(4),
                type: "vec4<f32>"
            },
            uInputPixel: {
                value: new Float32Array(4),
                type: "vec4<f32>"
            },
            uInputClamp: {
                value: new Float32Array(4),
                type: "vec4<f32>"
            },
            uOutputFrame: {
                value: new Float32Array(4),
                type: "vec4<f32>"
            },
            uGlobalFrame: {
                value: new Float32Array(4),
                type: "vec4<f32>"
            },
            uOutputTexture: {
                value: new Float32Array(4),
                type: "vec4<f32>"
            }
        });
        this._globalFilterBindGroup = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BindGroup"]({});
        this.renderer = renderer;
    }
    /**
   * The back texture of the currently active filter. Requires the filter to have `blendRequired` set to true.
   * @readonly
   */ get activeBackTexture() {
        return this._activeFilterData?.backTexture;
    }
    /**
   * Pushes a filter instruction onto the filter stack.
   * @param instruction - The instruction containing the filter effect and container.
   * @internal
   */ push(instruction) {
        const renderer = this.renderer;
        const filters = instruction.filterEffect.filters;
        const filterData = this._pushFilterData();
        filterData.skip = false;
        filterData.filters = filters;
        filterData.container = instruction.container;
        filterData.outputRenderSurface = renderer.renderTarget.renderSurface;
        const colorTextureSource = renderer.renderTarget.renderTarget.colorTexture.source;
        const rootResolution = colorTextureSource.resolution;
        const rootAntialias = colorTextureSource.antialias;
        if (filters.length === 0) {
            filterData.skip = true;
            return;
        }
        const bounds = filterData.bounds;
        this._calculateFilterArea(instruction, bounds);
        this._calculateFilterBounds(filterData, renderer.renderTarget.rootViewPort, rootAntialias, rootResolution, 1);
        if (filterData.skip) {
            return;
        }
        const previousFilterData = this._getPreviousFilterData();
        const globalResolution = this._findFilterResolution(rootResolution);
        let offsetX = 0;
        let offsetY = 0;
        if (previousFilterData) {
            offsetX = previousFilterData.bounds.minX;
            offsetY = previousFilterData.bounds.minY;
        }
        this._calculateGlobalFrame(filterData, offsetX, offsetY, globalResolution, colorTextureSource.width, colorTextureSource.height);
        this._setupFilterTextures(filterData, bounds, renderer, previousFilterData);
    }
    /**
   * Applies filters to a texture.
   *
   * This method takes a texture and a list of filters, applies the filters to the texture,
   * and returns the resulting texture.
   * @param {object} params - The parameters for applying filters.
   * @param {Texture} params.texture - The texture to apply filters to.
   * @param {Filter[]} params.filters - The filters to apply.
   * @returns {Texture} The resulting texture after all filters have been applied.
   * @example
   *
   * ```ts
   * // Create a texture and a list of filters
   * const texture = new Texture(...);
   * const filters = [new BlurFilter(), new ColorMatrixFilter()];
   *
   * // Apply the filters to the texture
   * const resultTexture = filterSystem.applyToTexture({ texture, filters });
   *
   * // Use the resulting texture
   * sprite.texture = resultTexture;
   * ```
   *
   * Key Points:
   * 1. padding is not currently supported here - so clipping may occur with filters that use padding.
   * 2. If all filters are disabled or skipped, the original texture is returned.
   */ generateFilteredTexture({ texture, filters }) {
        const filterData = this._pushFilterData();
        this._activeFilterData = filterData;
        filterData.skip = false;
        filterData.filters = filters;
        const colorTextureSource = texture.source;
        const rootResolution = colorTextureSource.resolution;
        const rootAntialias = colorTextureSource.antialias;
        if (filters.length === 0) {
            filterData.skip = true;
            return texture;
        }
        const bounds = filterData.bounds;
        bounds.addRect(texture.frame);
        this._calculateFilterBounds(filterData, bounds.rectangle, rootAntialias, rootResolution, 0);
        if (filterData.skip) {
            return texture;
        }
        const globalResolution = rootResolution;
        const offsetX = 0;
        const offsetY = 0;
        this._calculateGlobalFrame(filterData, offsetX, offsetY, globalResolution, colorTextureSource.width, colorTextureSource.height);
        filterData.outputRenderSurface = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].getOptimalTexture(bounds.width, bounds.height, filterData.resolution, filterData.antialias);
        filterData.backTexture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY;
        filterData.inputTexture = texture;
        const renderer = this.renderer;
        renderer.renderTarget.finishRenderPass();
        this._applyFiltersToTexture(filterData, true);
        const outputTexture = filterData.outputRenderSurface;
        outputTexture.source.alphaMode = "premultiplied-alpha";
        return outputTexture;
    }
    /** @internal */ pop() {
        const renderer = this.renderer;
        const filterData = this._popFilterData();
        if (filterData.skip) {
            return;
        }
        renderer.globalUniforms.pop();
        renderer.renderTarget.finishRenderPass();
        this._activeFilterData = filterData;
        this._applyFiltersToTexture(filterData, false);
        if (filterData.blendRequired) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(filterData.backTexture);
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(filterData.inputTexture);
    }
    /**
   * Copies the last render surface to a texture.
   * @param lastRenderSurface - The last render surface to copy from.
   * @param bounds - The bounds of the area to copy.
   * @param previousBounds - The previous bounds to use for offsetting the copy.
   */ getBackTexture(lastRenderSurface, bounds, previousBounds) {
        const backgroundResolution = lastRenderSurface.colorTexture.source._resolution;
        const backTexture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].getOptimalTexture(bounds.width, bounds.height, backgroundResolution, false);
        let x = bounds.minX;
        let y = bounds.minY;
        if (previousBounds) {
            x -= previousBounds.minX;
            y -= previousBounds.minY;
        }
        x = Math.floor(x * backgroundResolution);
        y = Math.floor(y * backgroundResolution);
        const width = Math.ceil(bounds.width * backgroundResolution);
        const height = Math.ceil(bounds.height * backgroundResolution);
        this.renderer.renderTarget.copyToTexture(lastRenderSurface, backTexture, {
            x,
            y
        }, {
            width,
            height
        }, {
            x: 0,
            y: 0
        });
        return backTexture;
    }
    /**
   * Applies a filter to a texture.
   * @param filter - The filter to apply.
   * @param input - The input texture.
   * @param output - The output render surface.
   * @param clear - Whether to clear the output surface before applying the filter.
   */ applyFilter(filter, input, output, clear) {
        const renderer = this.renderer;
        const filterData = this._activeFilterData;
        const outputRenderSurface = filterData.outputRenderSurface;
        const isFinalTarget = outputRenderSurface === output;
        const rootResolution = renderer.renderTarget.rootRenderTarget.colorTexture.source._resolution;
        const resolution = this._findFilterResolution(rootResolution);
        let offsetX = 0;
        let offsetY = 0;
        if (isFinalTarget) {
            const offset = this._findPreviousFilterOffset();
            offsetX = offset.x;
            offsetY = offset.y;
        }
        this._updateFilterUniforms(input, output, filterData, offsetX, offsetY, resolution, isFinalTarget, clear);
        this._setupBindGroupsAndRender(filter, input, renderer);
    }
    /**
   * Multiply _input normalized coordinates_ to this matrix to get _sprite texture normalized coordinates_.
   *
   * Use `outputMatrix * vTextureCoord` in the shader.
   * @param outputMatrix - The matrix to output to.
   * @param {Sprite} sprite - The sprite to map to.
   * @returns The mapped matrix.
   */ calculateSpriteMatrix(outputMatrix, sprite) {
        const data = this._activeFilterData;
        const mappedMatrix = outputMatrix.set(data.inputTexture._source.width, 0, 0, data.inputTexture._source.height, data.bounds.minX, data.bounds.minY);
        const worldTransform = sprite.worldTransform.copyTo(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"].shared);
        const renderGroup = sprite.renderGroup || sprite.parentRenderGroup;
        if (renderGroup && renderGroup.cacheToLocalTransform) {
            worldTransform.prepend(renderGroup.cacheToLocalTransform);
        }
        worldTransform.invert();
        mappedMatrix.prepend(worldTransform);
        mappedMatrix.scale(1 / sprite.texture.orig.width, 1 / sprite.texture.orig.height);
        mappedMatrix.translate(sprite.anchor.x, sprite.anchor.y);
        return mappedMatrix;
    }
    destroy() {}
    /**
   * Sets up the bind groups and renders the filter.
   * @param filter - The filter to apply
   * @param input - The input texture
   * @param renderer - The renderer instance
   */ _setupBindGroupsAndRender(filter, input, renderer) {
        if (renderer.renderPipes.uniformBatch) {
            const batchUniforms = renderer.renderPipes.uniformBatch.getUboResource(this._filterGlobalUniforms);
            this._globalFilterBindGroup.setResource(batchUniforms, 0);
        } else {
            this._globalFilterBindGroup.setResource(this._filterGlobalUniforms, 0);
        }
        this._globalFilterBindGroup.setResource(input.source, 1);
        this._globalFilterBindGroup.setResource(input.source.style, 2);
        filter.groups[0] = this._globalFilterBindGroup;
        renderer.encoder.draw({
            geometry: quadGeometry,
            shader: filter,
            state: filter._state,
            topology: "triangle-list"
        });
        if (renderer.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererType"].WEBGL) {
            renderer.renderTarget.finishRenderPass();
        }
    }
    /**
   * Sets up the filter textures including input texture and back texture if needed.
   * @param filterData - The filter data to update
   * @param bounds - The bounds for the texture
   * @param renderer - The renderer instance
   * @param previousFilterData - The previous filter data for back texture calculation
   */ _setupFilterTextures(filterData, bounds, renderer, previousFilterData) {
        filterData.backTexture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY;
        filterData.inputTexture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].getOptimalTexture(bounds.width, bounds.height, filterData.resolution, filterData.antialias);
        if (filterData.blendRequired) {
            renderer.renderTarget.finishRenderPass();
            const renderTarget = renderer.renderTarget.getRenderTarget(filterData.outputRenderSurface);
            filterData.backTexture = this.getBackTexture(renderTarget, bounds, previousFilterData?.bounds);
        }
        renderer.renderTarget.bind(filterData.inputTexture, true);
        renderer.globalUniforms.push({
            offset: bounds
        });
    }
    /**
   * Calculates and sets the global frame for the filter.
   * @param filterData - The filter data to update
   * @param offsetX - The X offset
   * @param offsetY - The Y offset
   * @param globalResolution - The global resolution
   * @param sourceWidth - The source texture width
   * @param sourceHeight - The source texture height
   */ _calculateGlobalFrame(filterData, offsetX, offsetY, globalResolution, sourceWidth, sourceHeight) {
        const globalFrame = filterData.globalFrame;
        globalFrame.x = offsetX * globalResolution;
        globalFrame.y = offsetY * globalResolution;
        globalFrame.width = sourceWidth * globalResolution;
        globalFrame.height = sourceHeight * globalResolution;
    }
    /**
   * Updates the filter uniforms with the current filter state.
   * @param input - The input texture
   * @param output - The output render surface
   * @param filterData - The current filter data
   * @param offsetX - The X offset for positioning
   * @param offsetY - The Y offset for positioning
   * @param resolution - The current resolution
   * @param isFinalTarget - Whether this is the final render target
   * @param clear - Whether to clear the output surface
   */ _updateFilterUniforms(input, output, filterData, offsetX, offsetY, resolution, isFinalTarget, clear) {
        const uniforms = this._filterGlobalUniforms.uniforms;
        const outputFrame = uniforms.uOutputFrame;
        const inputSize = uniforms.uInputSize;
        const inputPixel = uniforms.uInputPixel;
        const inputClamp = uniforms.uInputClamp;
        const globalFrame = uniforms.uGlobalFrame;
        const outputTexture = uniforms.uOutputTexture;
        if (isFinalTarget) {
            outputFrame[0] = filterData.bounds.minX - offsetX;
            outputFrame[1] = filterData.bounds.minY - offsetY;
        } else {
            outputFrame[0] = 0;
            outputFrame[1] = 0;
        }
        outputFrame[2] = input.frame.width;
        outputFrame[3] = input.frame.height;
        inputSize[0] = input.source.width;
        inputSize[1] = input.source.height;
        inputSize[2] = 1 / inputSize[0];
        inputSize[3] = 1 / inputSize[1];
        inputPixel[0] = input.source.pixelWidth;
        inputPixel[1] = input.source.pixelHeight;
        inputPixel[2] = 1 / inputPixel[0];
        inputPixel[3] = 1 / inputPixel[1];
        inputClamp[0] = 0.5 * inputPixel[2];
        inputClamp[1] = 0.5 * inputPixel[3];
        inputClamp[2] = input.frame.width * inputSize[2] - 0.5 * inputPixel[2];
        inputClamp[3] = input.frame.height * inputSize[3] - 0.5 * inputPixel[3];
        const rootTexture = this.renderer.renderTarget.rootRenderTarget.colorTexture;
        globalFrame[0] = offsetX * resolution;
        globalFrame[1] = offsetY * resolution;
        globalFrame[2] = rootTexture.source.width * resolution;
        globalFrame[3] = rootTexture.source.height * resolution;
        if (output instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]) output.source.resource = null;
        const renderTarget = this.renderer.renderTarget.getRenderTarget(output);
        this.renderer.renderTarget.bind(output, !!clear);
        if (output instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]) {
            outputTexture[0] = output.frame.width;
            outputTexture[1] = output.frame.height;
        } else {
            outputTexture[0] = renderTarget.width;
            outputTexture[1] = renderTarget.height;
        }
        outputTexture[2] = renderTarget.isRoot ? -1 : 1;
        this._filterGlobalUniforms.update();
    }
    /**
   * Finds the correct resolution by looking back through the filter stack.
   * @param rootResolution - The fallback root resolution to use
   * @returns The resolution from the previous filter or root resolution
   */ _findFilterResolution(rootResolution) {
        let currentIndex = this._filterStackIndex - 1;
        while(currentIndex > 0 && this._filterStack[currentIndex].skip){
            --currentIndex;
        }
        return currentIndex > 0 && this._filterStack[currentIndex].inputTexture ? this._filterStack[currentIndex].inputTexture.source._resolution : rootResolution;
    }
    /**
   * Finds the offset from the previous non-skipped filter in the stack.
   * @returns The offset coordinates from the previous filter
   */ _findPreviousFilterOffset() {
        let offsetX = 0;
        let offsetY = 0;
        let lastIndex = this._filterStackIndex;
        while(lastIndex > 0){
            lastIndex--;
            const prevFilterData = this._filterStack[lastIndex];
            if (!prevFilterData.skip) {
                offsetX = prevFilterData.bounds.minX;
                offsetY = prevFilterData.bounds.minY;
                break;
            }
        }
        return {
            x: offsetX,
            y: offsetY
        };
    }
    /**
   * Calculates the filter area bounds based on the instruction type.
   * @param instruction - The filter instruction
   * @param bounds - The bounds object to populate
   */ _calculateFilterArea(instruction, bounds) {
        if (instruction.renderables) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getRenderableBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getGlobalRenderableBounds"])(instruction.renderables, bounds);
        } else if (instruction.filterEffect.filterArea) {
            bounds.clear();
            bounds.addRect(instruction.filterEffect.filterArea);
            bounds.applyMatrix(instruction.container.worldTransform);
        } else {
            instruction.container.getFastGlobalBounds(true, bounds);
        }
        if (instruction.container) {
            const renderGroup = instruction.container.renderGroup || instruction.container.parentRenderGroup;
            const filterFrameTransform = renderGroup.cacheToLocalTransform;
            if (filterFrameTransform) {
                bounds.applyMatrix(filterFrameTransform);
            }
        }
    }
    _applyFiltersToTexture(filterData, clear) {
        const inputTexture = filterData.inputTexture;
        const bounds = filterData.bounds;
        const filters = filterData.filters;
        this._globalFilterBindGroup.setResource(inputTexture.source.style, 2);
        this._globalFilterBindGroup.setResource(filterData.backTexture.source, 3);
        if (filters.length === 1) {
            filters[0].apply(this, inputTexture, filterData.outputRenderSurface, clear);
        } else {
            let flip = filterData.inputTexture;
            const tempTexture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].getOptimalTexture(bounds.width, bounds.height, flip.source._resolution, false);
            let flop = tempTexture;
            let i = 0;
            for(i = 0; i < filters.length - 1; ++i){
                const filter = filters[i];
                filter.apply(this, flip, flop, true);
                const t = flip;
                flip = flop;
                flop = t;
            }
            filters[i].apply(this, flip, filterData.outputRenderSurface, clear);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(tempTexture);
        }
    }
    _calculateFilterBounds(filterData, viewPort, rootAntialias, rootResolution, paddingMultiplier) {
        const renderer = this.renderer;
        const bounds = filterData.bounds;
        const filters = filterData.filters;
        let resolution = Infinity;
        let padding = 0;
        let antialias = true;
        let blendRequired = false;
        let enabled = false;
        let clipToViewport = true;
        for(let i = 0; i < filters.length; i++){
            const filter = filters[i];
            resolution = Math.min(resolution, filter.resolution === "inherit" ? rootResolution : filter.resolution);
            padding += filter.padding;
            if (filter.antialias === "off") {
                antialias = false;
            } else if (filter.antialias === "inherit") {
                antialias && (antialias = rootAntialias);
            }
            if (!filter.clipToViewport) {
                clipToViewport = false;
            }
            const isCompatible = !!(filter.compatibleRenderers & renderer.type);
            if (!isCompatible) {
                enabled = false;
                break;
            }
            if (filter.blendRequired && !(renderer.backBuffer?.useBackBuffer ?? true)) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("Blend filter requires backBuffer on WebGL renderer to be enabled. Set `useBackBuffer: true` in the renderer options.");
                enabled = false;
                break;
            }
            enabled = filter.enabled || enabled;
            blendRequired || (blendRequired = filter.blendRequired);
        }
        if (!enabled) {
            filterData.skip = true;
            return;
        }
        if (clipToViewport) {
            bounds.fitBounds(0, viewPort.width / rootResolution, 0, viewPort.height / rootResolution);
        }
        bounds.scale(resolution).ceil().scale(1 / resolution).pad((padding | 0) * paddingMultiplier);
        if (!bounds.isPositive) {
            filterData.skip = true;
            return;
        }
        filterData.antialias = antialias;
        filterData.resolution = resolution;
        filterData.blendRequired = blendRequired;
    }
    _popFilterData() {
        this._filterStackIndex--;
        return this._filterStack[this._filterStackIndex];
    }
    _getPreviousFilterData() {
        let previousFilterData;
        let index = this._filterStackIndex - 1;
        while(index > 0){
            index--;
            previousFilterData = this._filterStack[index];
            if (!previousFilterData.skip) {
                break;
            }
        }
        return previousFilterData;
    }
    _pushFilterData() {
        let filterData = this._filterStack[this._filterStackIndex];
        if (!filterData) {
            filterData = this._filterStack[this._filterStackIndex] = new FilterData();
        }
        this._filterStackIndex++;
        return filterData;
    }
}
/** @ignore */ FilterSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "filter"
};
;
 //# sourceMappingURL=FilterSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/init.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/FilterPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/FilterSystem.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FilterSystem"]);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FilterPipe"]); //# sourceMappingURL=init.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment-webworker/webworkerAll.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$app$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/app/init.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$spritesheet$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/spritesheet/init.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/init.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/init.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/init.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$particle$2d$container$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/particle-container/init.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/init.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/init.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$html$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-html/init.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$tiling$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-tiling/init.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2d$nine$2d$slice$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite-nine-slice/init.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$init$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/init.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
"use strict"; //# sourceMappingURL=webworkerAll.mjs.map
}),
];

//# sourceMappingURL=5703a_pixi_js_lib_31cdc757._.js.map