module.exports = [
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
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gpu/GpuGraphicsAdaptor.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuGraphicsAdaptor",
    ()=>GpuGraphicsAdaptor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gpu$2f$getTextureBatchBindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gpu/getTextureBatchBindGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compileHighShaderToProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$colorBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/colorBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$generateTextureBatchBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/generateTextureBatchBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$localUniformBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/localUniformBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/roundPixelsBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
;
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
class GpuGraphicsAdaptor {
    constructor(){
        this._maxTextures = 0;
    }
    contextChange(renderer) {
        const localUniforms = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
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
        this._maxTextures = renderer.limits.maxBatchableTextures;
        const gpuProgram = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compileHighShaderGpuProgram"])({
            name: "graphics",
            bits: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$colorBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["colorBit"],
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$generateTextureBatchBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateTextureBatchBit"])(this._maxTextures),
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$localUniformBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["localUniformBitGroup2"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roundPixelsBit"]
            ]
        });
        this.shader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Shader"]({
            gpuProgram,
            resources: {
                // added on the fly!
                localUniforms
            }
        });
    }
    execute(graphicsPipe, renderable) {
        const context = renderable.context;
        const shader = context.customShader || this.shader;
        const renderer = graphicsPipe.renderer;
        const contextSystem = renderer.graphicsContext;
        const { batcher, instructions } = contextSystem.getContextRenderData(context);
        const encoder = renderer.encoder;
        encoder.setGeometry(batcher.geometry, shader.gpuProgram);
        const globalUniformsBindGroup = renderer.globalUniforms.bindGroup;
        encoder.setBindGroup(0, globalUniformsBindGroup, shader.gpuProgram);
        const localBindGroup = renderer.renderPipes.uniformBatch.getUniformBindGroup(shader.resources.localUniforms, true);
        encoder.setBindGroup(2, localBindGroup, shader.gpuProgram);
        const batches = instructions.instructions;
        let topology = null;
        for(let i = 0; i < instructions.instructionSize; i++){
            const batch = batches[i];
            if (batch.topology !== topology) {
                topology = batch.topology;
                encoder.setPipelineFromGeometryProgramAndState(batcher.geometry, shader.gpuProgram, graphicsPipe.state, batch.topology);
            }
            shader.groups[1] = batch.bindGroup;
            if (!batch.gpuBindGroup) {
                const textureBatch = batch.textures;
                batch.bindGroup = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gpu$2f$getTextureBatchBindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTextureBatchBindGroup"])(textureBatch.textures, textureBatch.count, this._maxTextures);
                batch.gpuBindGroup = renderer.bindGroup.getBindGroup(batch.bindGroup, shader.gpuProgram, 1);
            }
            encoder.setBindGroup(1, batch.bindGroup, shader.gpuProgram);
            encoder.renderPassEncoder.drawIndexed(batch.size, 1, batch.start);
        }
    }
    destroy() {
        this.shader.destroy(true);
        this.shader = null;
    }
}
/** @ignore */ GpuGraphicsAdaptor.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipesAdaptor
    ],
    name: "graphics"
};
;
 //# sourceMappingURL=GpuGraphicsAdaptor.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/textureBit.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "textureBit",
    ()=>textureBit,
    "textureBitGl",
    ()=>textureBitGl
]);
"use strict";
const textureBit = {
    name: "texture-bit",
    vertex: {
        header: /* wgsl */ `

        struct TextureUniforms {
            uTextureMatrix:mat3x3<f32>,
        }

        @group(2) @binding(2) var<uniform> textureUniforms : TextureUniforms;
        `,
        main: /* wgsl */ `
            uv = (textureUniforms.uTextureMatrix * vec3(uv, 1.0)).xy;
        `
    },
    fragment: {
        header: /* wgsl */ `
            @group(2) @binding(0) var uTexture: texture_2d<f32>;
            @group(2) @binding(1) var uSampler: sampler;


        `,
        main: /* wgsl */ `
            outColor = textureSample(uTexture, uSampler, vUV);
        `
    }
};
const textureBitGl = {
    name: "texture-bit",
    vertex: {
        header: /* glsl */ `
            uniform mat3 uTextureMatrix;
        `,
        main: /* glsl */ `
            uv = (uTextureMatrix * vec3(uv, 1.0)).xy;
        `
    },
    fragment: {
        header: /* glsl */ `
        uniform sampler2D uTexture;


        `,
        main: /* glsl */ `
            outColor = texture(uTexture, vUV);
        `
    }
};
;
 //# sourceMappingURL=textureBit.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/gpu/GpuMeshAdapter.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuMeshAdapter",
    ()=>GpuMeshAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compileHighShaderToProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$localUniformBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/localUniformBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/roundPixelsBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$textureBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/textureBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
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
"use strict";
class GpuMeshAdapter {
    init() {
        const gpuProgram = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compileHighShaderGpuProgram"])({
            name: "mesh",
            bits: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$localUniformBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["localUniformBit"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$textureBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["textureBit"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roundPixelsBit"]
            ]
        });
        this._shader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Shader"]({
            gpuProgram,
            resources: {
                uTexture: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY._source,
                uSampler: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY._source.style,
                textureUniforms: {
                    uTextureMatrix: {
                        type: "mat3x3<f32>",
                        value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"]()
                    }
                }
            }
        });
    }
    execute(meshPipe, mesh) {
        const renderer = meshPipe.renderer;
        let shader = mesh._shader;
        if (!shader) {
            shader = this._shader;
            shader.groups[2] = renderer.texture.getTextureBindGroup(mesh.texture);
        } else if (!shader.gpuProgram) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("Mesh shader has no gpuProgram", mesh.shader);
            return;
        }
        const gpuProgram = shader.gpuProgram;
        if (gpuProgram.autoAssignGlobalUniforms) {
            shader.groups[0] = renderer.globalUniforms.bindGroup;
        }
        if (gpuProgram.autoAssignLocalUniforms) {
            const localUniforms = meshPipe.localUniforms;
            shader.groups[1] = renderer.renderPipes.uniformBatch.getUniformBindGroup(localUniforms, true);
        }
        renderer.encoder.draw({
            geometry: mesh._geometry,
            shader,
            state: mesh.state
        });
    }
    destroy() {
        this._shader.destroy(true);
        this._shader = null;
    }
}
/** @ignore */ GpuMeshAdapter.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipesAdaptor
    ],
    name: "mesh"
};
;
 //# sourceMappingURL=GpuMeshAdapter.mjs.map
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
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gpu/GpuBatchAdaptor.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuBatchAdaptor",
    ()=>GpuBatchAdaptor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gpu$2f$getTextureBatchBindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gpu/getTextureBatchBindGroup.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const tempState = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].for2d();
class GpuBatchAdaptor {
    start(batchPipe, geometry, shader) {
        const renderer = batchPipe.renderer;
        const encoder = renderer.encoder;
        const program = shader.gpuProgram;
        this._shader = shader;
        this._geometry = geometry;
        encoder.setGeometry(geometry, program);
        tempState.blendMode = "normal";
        renderer.pipeline.getPipeline(geometry, program, tempState);
        const globalUniformsBindGroup = renderer.globalUniforms.bindGroup;
        encoder.resetBindGroup(1);
        encoder.setBindGroup(0, globalUniformsBindGroup, program);
    }
    execute(batchPipe, batch) {
        const program = this._shader.gpuProgram;
        const renderer = batchPipe.renderer;
        const encoder = renderer.encoder;
        if (!batch.bindGroup) {
            const textureBatch = batch.textures;
            batch.bindGroup = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gpu$2f$getTextureBatchBindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTextureBatchBindGroup"])(textureBatch.textures, textureBatch.count, renderer.limits.maxBatchableTextures);
        }
        tempState.blendMode = batch.blendMode;
        const gpuBindGroup = renderer.bindGroup.getBindGroup(batch.bindGroup, program, 1);
        const pipeline = renderer.pipeline.getPipeline(this._geometry, program, tempState, batch.topology);
        batch.bindGroup._touch(renderer.textureGC.count);
        encoder.setPipeline(pipeline);
        encoder.renderPassEncoder.setBindGroup(1, gpuBindGroup);
        encoder.renderPassEncoder.drawIndexed(batch.size, 1, batch.start);
    }
}
/** @ignore */ GpuBatchAdaptor.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipesAdaptor
    ],
    name: "batch"
};
;
 //# sourceMappingURL=GpuBatchAdaptor.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/CustomRenderPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CustomRenderPipe",
    ()=>CustomRenderPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class CustomRenderPipe {
    constructor(renderer){
        this._renderer = renderer;
    }
    updateRenderable() {}
    destroyRenderable() {}
    validateRenderable() {
        return false;
    }
    addRenderable(container, instructionSet) {
        this._renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add(container);
    }
    execute(container) {
        if (!container.isRenderable) return;
        container.render(this._renderer);
    }
    destroy() {
        this._renderer = null;
    }
}
CustomRenderPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "customRender"
};
;
 //# sourceMappingURL=CustomRenderPipe.mjs.map
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
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/executeInstructions.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "executeInstructions",
    ()=>executeInstructions
]);
"use strict";
function executeInstructions(renderGroup, renderer) {
    const instructionSet = renderGroup.instructionSet;
    const instructions = instructionSet.instructions;
    for(let i = 0; i < instructionSet.instructionSize; i++){
        const instruction = instructions[i];
        renderer[instruction.renderPipeId].execute(instruction);
    }
}
;
 //# sourceMappingURL=executeInstructions.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroupPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderGroupPipe",
    ()=>RenderGroupPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/BatchableSprite.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$executeInstructions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/executeInstructions.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
"use strict";
const tempMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"]();
class RenderGroupPipe {
    constructor(renderer){
        this._renderer = renderer;
    }
    addRenderGroup(renderGroup, instructionSet) {
        if (renderGroup.isCachedAsTexture) {
            this._addRenderableCacheAsTexture(renderGroup, instructionSet);
        } else {
            this._addRenderableDirect(renderGroup, instructionSet);
        }
    }
    execute(renderGroup) {
        if (!renderGroup.isRenderable) return;
        if (renderGroup.isCachedAsTexture) {
            this._executeCacheAsTexture(renderGroup);
        } else {
            this._executeDirect(renderGroup);
        }
    }
    destroy() {
        this._renderer = null;
    }
    _addRenderableDirect(renderGroup, instructionSet) {
        this._renderer.renderPipes.batch.break(instructionSet);
        if (renderGroup._batchableRenderGroup) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].return(renderGroup._batchableRenderGroup);
            renderGroup._batchableRenderGroup = null;
        }
        instructionSet.add(renderGroup);
    }
    _addRenderableCacheAsTexture(renderGroup, instructionSet) {
        const batchableRenderGroup = renderGroup._batchableRenderGroup ?? (renderGroup._batchableRenderGroup = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].get(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableSprite"]));
        batchableRenderGroup.renderable = renderGroup.root;
        batchableRenderGroup.transform = renderGroup.root.relativeGroupTransform;
        batchableRenderGroup.texture = renderGroup.texture;
        batchableRenderGroup.bounds = renderGroup._textureBounds;
        instructionSet.add(renderGroup);
        this._renderer.renderPipes.blendMode.pushBlendMode(renderGroup, renderGroup.root.groupBlendMode, instructionSet);
        this._renderer.renderPipes.batch.addToBatch(batchableRenderGroup, instructionSet);
        this._renderer.renderPipes.blendMode.popBlendMode(instructionSet);
    }
    _executeCacheAsTexture(renderGroup) {
        if (renderGroup.textureNeedsUpdate) {
            renderGroup.textureNeedsUpdate = false;
            const worldTransformMatrix = tempMatrix.identity().translate(-renderGroup._textureBounds.x, -renderGroup._textureBounds.y);
            this._renderer.renderTarget.push(renderGroup.texture, true, null, renderGroup.texture.frame);
            this._renderer.globalUniforms.push({
                worldTransformMatrix,
                worldColor: 4294967295,
                offset: {
                    x: 0,
                    y: 0
                }
            });
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$executeInstructions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["executeInstructions"])(renderGroup, this._renderer.renderPipes);
            this._renderer.renderTarget.finishRenderPass();
            this._renderer.renderTarget.pop();
            this._renderer.globalUniforms.pop();
        }
        renderGroup._batchableRenderGroup._batcher.updateElement(renderGroup._batchableRenderGroup);
        renderGroup._batchableRenderGroup._batcher.geometry.buffers[0].update();
    }
    _executeDirect(renderGroup) {
        this._renderer.globalUniforms.push({
            worldTransformMatrix: renderGroup.inverseParentTextureTransform,
            worldColor: renderGroup.worldColorAlpha
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$executeInstructions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["executeInstructions"])(renderGroup, this._renderer.renderPipes);
        this._renderer.globalUniforms.pop();
    }
}
RenderGroupPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "renderGroup"
};
;
 //# sourceMappingURL=RenderGroupPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/clearList.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearList",
    ()=>clearList
]);
"use strict";
function clearList(list, index) {
    index || (index = 0);
    for(let j = index; j < list.length; j++){
        if (list[j]) {
            list[j] = null;
        } else {
            break;
        }
    }
}
;
 //# sourceMappingURL=clearList.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/updateRenderGroupTransforms.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "updateRenderGroupTransform",
    ()=>updateRenderGroupTransform,
    "updateRenderGroupTransforms",
    ()=>updateRenderGroupTransforms,
    "updateTransformAndChildren",
    ()=>updateTransformAndChildren
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/Container.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$clearList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/clearList.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyColors$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/multiplyColors.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const tempContainer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Container"]();
const UPDATE_BLEND_COLOR_VISIBLE = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_VISIBLE"] | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_COLOR"] | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_BLEND"];
function updateRenderGroupTransforms(renderGroup, updateChildRenderGroups = false) {
    updateRenderGroupTransform(renderGroup);
    const childrenToUpdate = renderGroup.childrenToUpdate;
    const updateTick = renderGroup.updateTick++;
    for(const j in childrenToUpdate){
        const renderGroupDepth = Number(j);
        const childrenAtDepth = childrenToUpdate[j];
        const list = childrenAtDepth.list;
        const index = childrenAtDepth.index;
        for(let i = 0; i < index; i++){
            const child = list[i];
            if (child.parentRenderGroup === renderGroup && child.relativeRenderGroupDepth === renderGroupDepth) {
                updateTransformAndChildren(child, updateTick, 0);
            }
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$clearList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearList"])(list, index);
        childrenAtDepth.index = 0;
    }
    if (updateChildRenderGroups) {
        for(let i = 0; i < renderGroup.renderGroupChildren.length; i++){
            updateRenderGroupTransforms(renderGroup.renderGroupChildren[i], updateChildRenderGroups);
        }
    }
}
function updateRenderGroupTransform(renderGroup) {
    const root = renderGroup.root;
    let worldAlpha;
    if (renderGroup.renderGroupParent) {
        const renderGroupParent = renderGroup.renderGroupParent;
        renderGroup.worldTransform.appendFrom(root.relativeGroupTransform, renderGroupParent.worldTransform);
        renderGroup.worldColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyColors$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["multiplyColors"])(root.groupColor, renderGroupParent.worldColor);
        worldAlpha = root.groupAlpha * renderGroupParent.worldAlpha;
    } else {
        renderGroup.worldTransform.copyFrom(root.localTransform);
        renderGroup.worldColor = root.localColor;
        worldAlpha = root.localAlpha;
    }
    worldAlpha = worldAlpha < 0 ? 0 : worldAlpha > 1 ? 1 : worldAlpha;
    renderGroup.worldAlpha = worldAlpha;
    renderGroup.worldColorAlpha = renderGroup.worldColor + ((worldAlpha * 255 | 0) << 24);
}
function updateTransformAndChildren(container, updateTick, updateFlags) {
    if (updateTick === container.updateTick) return;
    container.updateTick = updateTick;
    container.didChange = false;
    const localTransform = container.localTransform;
    container.updateLocalTransform();
    const parent = container.parent;
    if (parent && !parent.renderGroup) {
        updateFlags |= container._updateFlags;
        container.relativeGroupTransform.appendFrom(localTransform, parent.relativeGroupTransform);
        if (updateFlags & UPDATE_BLEND_COLOR_VISIBLE) {
            updateColorBlendVisibility(container, parent, updateFlags);
        }
    } else {
        updateFlags = container._updateFlags;
        container.relativeGroupTransform.copyFrom(localTransform);
        if (updateFlags & UPDATE_BLEND_COLOR_VISIBLE) {
            updateColorBlendVisibility(container, tempContainer, updateFlags);
        }
    }
    if (!container.renderGroup) {
        const children = container.children;
        const length = children.length;
        for(let i = 0; i < length; i++){
            updateTransformAndChildren(children[i], updateTick, updateFlags);
        }
        const renderGroup = container.parentRenderGroup;
        const renderable = container;
        if (renderable.renderPipeId && !renderGroup.structureDidChange) {
            renderGroup.updateRenderable(renderable);
        }
    }
}
function updateColorBlendVisibility(container, parent, updateFlags) {
    if (updateFlags & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_COLOR"]) {
        container.groupColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyColors$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["multiplyColors"])(container.localColor, parent.groupColor);
        let groupAlpha = container.localAlpha * parent.groupAlpha;
        groupAlpha = groupAlpha < 0 ? 0 : groupAlpha > 1 ? 1 : groupAlpha;
        container.groupAlpha = groupAlpha;
        container.groupColorAlpha = container.groupColor + ((groupAlpha * 255 | 0) << 24);
    }
    if (updateFlags & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_BLEND"]) {
        container.groupBlendMode = container.localBlendMode === "inherit" ? parent.groupBlendMode : container.localBlendMode;
    }
    if (updateFlags & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_VISIBLE"]) {
        container.globalDisplayStatus = container.localDisplayStatus & parent.globalDisplayStatus;
    }
    container._updateFlags = 0;
}
;
 //# sourceMappingURL=updateRenderGroupTransforms.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/validateRenderables.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "validateRenderables",
    ()=>validateRenderables
]);
"use strict";
function validateRenderables(renderGroup, renderPipes) {
    const { list, index } = renderGroup.childrenRenderablesToUpdate;
    let rebuildRequired = false;
    for(let i = 0; i < index; i++){
        const container = list[i];
        const renderable = container;
        const pipe = renderPipes[renderable.renderPipeId];
        rebuildRequired = pipe.validateRenderable(container);
        if (rebuildRequired) {
            break;
        }
    }
    renderGroup.structureDidChange = rebuildRequired;
    return rebuildRequired;
}
;
 //# sourceMappingURL=validateRenderables.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroupSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderGroupSystem",
    ()=>RenderGroupSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TexturePool.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureStyle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$clearList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/clearList.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$executeInstructions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/executeInstructions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$updateRenderGroupTransforms$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/updateRenderGroupTransforms.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$validateRenderables$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/validateRenderables.mjs [app-ssr] (ecmascript)");
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
const tempMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"]();
class RenderGroupSystem {
    constructor(renderer){
        this._renderer = renderer;
    }
    render({ container, transform }) {
        const parent = container.parent;
        const renderGroupParent = container.renderGroup.renderGroupParent;
        container.parent = null;
        container.renderGroup.renderGroupParent = null;
        const renderer = this._renderer;
        const originalLocalTransform = tempMatrix;
        if (transform) {
            originalLocalTransform.copyFrom(container.renderGroup.localTransform);
            container.renderGroup.localTransform.copyFrom(transform);
        }
        const renderPipes = renderer.renderPipes;
        this._updateCachedRenderGroups(container.renderGroup, null);
        this._updateRenderGroups(container.renderGroup);
        renderer.globalUniforms.start({
            worldTransformMatrix: transform ? container.renderGroup.localTransform : container.renderGroup.worldTransform,
            worldColor: container.renderGroup.worldColorAlpha
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$executeInstructions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["executeInstructions"])(container.renderGroup, renderPipes);
        if (renderPipes.uniformBatch) {
            renderPipes.uniformBatch.renderEnd();
        }
        if (transform) {
            container.renderGroup.localTransform.copyFrom(originalLocalTransform);
        }
        container.parent = parent;
        container.renderGroup.renderGroupParent = renderGroupParent;
    }
    destroy() {
        this._renderer = null;
    }
    _updateCachedRenderGroups(renderGroup, closestCacheAsTexture) {
        renderGroup._parentCacheAsTextureRenderGroup = closestCacheAsTexture;
        if (renderGroup.isCachedAsTexture) {
            if (!renderGroup.textureNeedsUpdate) return;
            closestCacheAsTexture = renderGroup;
        }
        for(let i = renderGroup.renderGroupChildren.length - 1; i >= 0; i--){
            this._updateCachedRenderGroups(renderGroup.renderGroupChildren[i], closestCacheAsTexture);
        }
        renderGroup.invalidateMatrices();
        if (renderGroup.isCachedAsTexture) {
            if (renderGroup.textureNeedsUpdate) {
                const bounds = renderGroup.root.getLocalBounds();
                bounds.ceil();
                const lastTexture = renderGroup.texture;
                if (renderGroup.texture) {
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(renderGroup.texture, true);
                }
                const renderer = this._renderer;
                const resolution = renderGroup.textureOptions.resolution || renderer.view.resolution;
                const antialias = renderGroup.textureOptions.antialias ?? renderer.view.antialias;
                const scaleMode = renderGroup.textureOptions.scaleMode ?? "linear";
                const texture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].getOptimalTexture(bounds.width, bounds.height, resolution, antialias);
                texture._source.style = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureStyle"]({
                    scaleMode
                });
                renderGroup.texture = texture;
                renderGroup._textureBounds || (renderGroup._textureBounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bounds"]());
                renderGroup._textureBounds.copyFrom(bounds);
                if (lastTexture !== renderGroup.texture) {
                    if (renderGroup.renderGroupParent) {
                        renderGroup.renderGroupParent.structureDidChange = true;
                    }
                }
            }
        } else if (renderGroup.texture) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(renderGroup.texture, true);
            renderGroup.texture = null;
        }
    }
    _updateRenderGroups(renderGroup) {
        const renderer = this._renderer;
        const renderPipes = renderer.renderPipes;
        renderGroup.runOnRender(renderer);
        renderGroup.instructionSet.renderPipes = renderPipes;
        if (!renderGroup.structureDidChange) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$validateRenderables$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateRenderables"])(renderGroup, renderPipes);
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$clearList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearList"])(renderGroup.childrenRenderablesToUpdate.list, 0);
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$updateRenderGroupTransforms$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateRenderGroupTransforms"])(renderGroup);
        if (renderGroup.structureDidChange) {
            renderGroup.structureDidChange = false;
            this._buildInstructions(renderGroup, renderer);
        } else {
            this._updateRenderables(renderGroup);
        }
        renderGroup.childrenRenderablesToUpdate.index = 0;
        renderer.renderPipes.batch.upload(renderGroup.instructionSet);
        if (renderGroup.isCachedAsTexture && !renderGroup.textureNeedsUpdate) return;
        for(let i = 0; i < renderGroup.renderGroupChildren.length; i++){
            this._updateRenderGroups(renderGroup.renderGroupChildren[i]);
        }
    }
    _updateRenderables(renderGroup) {
        const { list, index } = renderGroup.childrenRenderablesToUpdate;
        for(let i = 0; i < index; i++){
            const container = list[i];
            if (container.didViewUpdate) {
                renderGroup.updateRenderable(container);
            }
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$clearList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearList"])(list, index);
    }
    _buildInstructions(renderGroup, rendererOrPipes) {
        const root = renderGroup.root;
        const instructionSet = renderGroup.instructionSet;
        instructionSet.reset();
        const renderer = rendererOrPipes.renderPipes ? rendererOrPipes : rendererOrPipes.batch.renderer;
        const renderPipes = renderer.renderPipes;
        renderPipes.batch.buildStart(instructionSet);
        renderPipes.blendMode.buildStart();
        renderPipes.colorMask.buildStart();
        if (root.sortableChildren) {
            root.sortChildren();
        }
        root.collectRenderablesWithEffects(instructionSet, renderer, null);
        renderPipes.batch.buildEnd(instructionSet);
        renderPipes.blendMode.buildEnd(instructionSet);
    }
}
/** @ignore */ RenderGroupSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "renderGroup"
};
;
 //# sourceMappingURL=RenderGroupSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/SpritePipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SpritePipe",
    ()=>SpritePipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/BatchableSprite.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class SpritePipe {
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
        batchableSprite.bounds = sprite.visualBounds;
        batchableSprite.texture = sprite._texture;
    }
    _getGpuSprite(sprite) {
        return sprite._gpuData[this._renderer.uid] || this._initGPUSprite(sprite);
    }
    _initGPUSprite(sprite) {
        const batchableSprite = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableSprite"]();
        batchableSprite.renderable = sprite;
        batchableSprite.transform = sprite.groupTransform;
        batchableSprite.texture = sprite._texture;
        batchableSprite.bounds = sprite.visualBounds;
        batchableSprite.roundPixels = this._renderer._roundPixels | sprite._roundPixels;
        sprite._gpuData[this._renderer.uid] = batchableSprite;
        return batchableSprite;
    }
    destroy() {
        this._renderer = null;
    }
}
/** @ignore */ SpritePipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "sprite"
};
;
 //# sourceMappingURL=SpritePipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/BatcherPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatcherPipe",
    ()=>BatcherPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$DefaultBatcher$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/DefaultBatcher.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const _BatcherPipe = class _BatcherPipe {
    constructor(renderer, adaptor){
        this.state = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].for2d();
        this._batchersByInstructionSet = /* @__PURE__ */ Object.create(null);
        /** A record of all active batchers, keyed by their names */ this._activeBatches = /* @__PURE__ */ Object.create(null);
        this.renderer = renderer;
        this._adaptor = adaptor;
        this._adaptor.init?.(this);
    }
    static getBatcher(name) {
        return new this._availableBatchers[name]();
    }
    buildStart(instructionSet) {
        let batchers = this._batchersByInstructionSet[instructionSet.uid];
        if (!batchers) {
            batchers = this._batchersByInstructionSet[instructionSet.uid] = /* @__PURE__ */ Object.create(null);
            batchers.default || (batchers.default = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$DefaultBatcher$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultBatcher"]({
                maxTextures: this.renderer.limits.maxBatchableTextures
            }));
        }
        this._activeBatches = batchers;
        this._activeBatch = this._activeBatches.default;
        for(const i in this._activeBatches){
            this._activeBatches[i].begin();
        }
    }
    addToBatch(batchableObject, instructionSet) {
        if (this._activeBatch.name !== batchableObject.batcherName) {
            this._activeBatch.break(instructionSet);
            let batch = this._activeBatches[batchableObject.batcherName];
            if (!batch) {
                batch = this._activeBatches[batchableObject.batcherName] = _BatcherPipe.getBatcher(batchableObject.batcherName);
                batch.begin();
            }
            this._activeBatch = batch;
        }
        this._activeBatch.add(batchableObject);
    }
    break(instructionSet) {
        this._activeBatch.break(instructionSet);
    }
    buildEnd(instructionSet) {
        this._activeBatch.break(instructionSet);
        const batches = this._activeBatches;
        for(const i in batches){
            const batch = batches[i];
            const geometry = batch.geometry;
            geometry.indexBuffer.setDataWithSize(batch.indexBuffer, batch.indexSize, true);
            geometry.buffers[0].setDataWithSize(batch.attributeBuffer.float32View, batch.attributeSize, false);
        }
    }
    upload(instructionSet) {
        const batchers = this._batchersByInstructionSet[instructionSet.uid];
        for(const i in batchers){
            const batcher = batchers[i];
            const geometry = batcher.geometry;
            if (batcher.dirty) {
                batcher.dirty = false;
                geometry.buffers[0].update(batcher.attributeSize * 4);
            }
        }
    }
    execute(batch) {
        if (batch.action === "startBatch") {
            const batcher = batch.batcher;
            const geometry = batcher.geometry;
            const shader = batcher.shader;
            this._adaptor.start(this, geometry, shader);
        }
        this._adaptor.execute(this, batch);
    }
    destroy() {
        this.state = null;
        this.renderer = null;
        this._adaptor = null;
        for(const i in this._activeBatches){
            this._activeBatches[i].destroy();
        }
        this._activeBatches = null;
    }
};
/** @ignore */ _BatcherPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "batch"
};
_BatcherPipe._availableBatchers = /* @__PURE__ */ Object.create(null);
let BatcherPipe = _BatcherPipe;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handleByMap(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].Batcher, BatcherPipe._availableBatchers);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$DefaultBatcher$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultBatcher"]);
;
 //# sourceMappingURL=BatcherPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/Filter.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Filter",
    ()=>Filter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
const _Filter = class _Filter extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Shader"] {
    /**
   * @param options - The optional parameters of this filter.
   */ constructor(options){
        options = {
            ..._Filter.defaultOptions,
            ...options
        };
        super(options);
        /** If enabled is true the filter is applied, if false it will not. */ this.enabled = true;
        /**
     * The gpu state the filter requires to render.
     * @internal
     */ this._state = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].for2d();
        this.blendMode = options.blendMode;
        this.padding = options.padding;
        if (typeof options.antialias === "boolean") {
            this.antialias = options.antialias ? "on" : "off";
        } else {
            this.antialias = options.antialias;
        }
        this.resolution = options.resolution;
        this.blendRequired = options.blendRequired;
        this.clipToViewport = options.clipToViewport;
        this.addResource("uTexture", 0, 1);
    }
    /**
   * Applies the filter
   * @param filterManager - The renderer to retrieve the filter from
   * @param input - The input render target.
   * @param output - The target to output to.
   * @param clearMode - Should the output be cleared before rendering to it
   */ apply(filterManager, input, output, clearMode) {
        filterManager.applyFilter(this, input, output, clearMode);
    }
    /**
   * Get the blend mode of the filter.
   * @default "normal"
   */ get blendMode() {
        return this._state.blendMode;
    }
    /** Sets the blend mode of the filter. */ set blendMode(value) {
        this._state.blendMode = value;
    }
    /**
   * A short hand function to create a filter based of a vertex and fragment shader src.
   * @param options
   * @returns A shiny new PixiJS filter!
   */ static from(options) {
        const { gpu, gl, ...rest } = options;
        let gpuProgram;
        let glProgram;
        if (gpu) {
            gpuProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuProgram"].from(gpu);
        }
        if (gl) {
            glProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlProgram"].from(gl);
        }
        return new _Filter({
            gpuProgram,
            glProgram,
            ...rest
        });
    }
};
/** The default filter settings */ _Filter.defaultOptions = {
    blendMode: "normal",
    resolution: 1,
    padding: 0,
    antialias: "off",
    blendRequired: false,
    clipToViewport: true
};
let Filter = _Filter;
;
 //# sourceMappingURL=Filter.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.frag.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>fragment
]);
var fragment = "in vec2 vMaskCoord;\nin vec2 vTextureCoord;\n\nuniform sampler2D uTexture;\nuniform sampler2D uMaskTexture;\n\nuniform float uAlpha;\nuniform vec4 uMaskClamp;\nuniform float uInverse;\n\nout vec4 finalColor;\n\nvoid main(void)\n{\n    float clip = step(3.5,\n        step(uMaskClamp.x, vMaskCoord.x) +\n        step(uMaskClamp.y, vMaskCoord.y) +\n        step(vMaskCoord.x, uMaskClamp.z) +\n        step(vMaskCoord.y, uMaskClamp.w));\n\n    // TODO look into why this is needed\n    float npmAlpha = uAlpha;\n    vec4 original = texture(uTexture, vTextureCoord);\n    vec4 masky = texture(uMaskTexture, vMaskCoord);\n    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);\n\n    float a = alphaMul * masky.r * npmAlpha * clip;\n\n    if (uInverse == 1.0) {\n        a = 1.0 - a;\n    }\n\n    finalColor = original * a;\n}\n";
;
 //# sourceMappingURL=mask.frag.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.vert.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>vertex
]);
var vertex = "in vec2 aPosition;\n\nout vec2 vTextureCoord;\nout vec2 vMaskCoord;\n\n\nuniform vec4 uInputSize;\nuniform vec4 uOutputFrame;\nuniform vec4 uOutputTexture;\nuniform mat3 uFilterMatrix;\n\nvec4 filterVertexPosition(  vec2 aPosition )\n{\n    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;\n       \n    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord(  vec2 aPosition )\n{\n    return aPosition * (uOutputFrame.zw * uInputSize.zw);\n}\n\nvec2 getFilterCoord( vec2 aPosition )\n{\n    return  ( uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;\n}   \n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition(aPosition);\n    vTextureCoord = filterTextureCoord(aPosition);\n    vMaskCoord = getFilterCoord(aPosition);\n}\n";
;
 //# sourceMappingURL=mask.vert.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.wgsl.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>source
]);
var source = "struct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\nstruct MaskUniforms {\n  uFilterMatrix:mat3x3<f32>,\n  uMaskClamp:vec4<f32>,\n  uAlpha:f32,\n  uInverse:f32,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n@group(0) @binding(1) var uTexture: texture_2d<f32>;\n@group(0) @binding(2) var uSampler : sampler;\n\n@group(1) @binding(0) var<uniform> filterUniforms : MaskUniforms;\n@group(1) @binding(1) var uMaskTexture: texture_2d<f32>;\n\nstruct VSOutput {\n    @builtin(position) position: vec4<f32>,\n    @location(0) uv : vec2<f32>,\n    @location(1) filterUv : vec2<f32>,\n};\n\nfn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>\n{\n    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;\n\n    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nfn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);\n}\n\nfn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);\n}\n\nfn getFilterCoord(aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return ( filterUniforms.uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;\n}\n\nfn getSize() -> vec2<f32>\n{\n  return gfu.uGlobalFrame.zw;\n}\n\n@vertex\nfn mainVertex(\n  @location(0) aPosition : vec2<f32>,\n) -> VSOutput {\n  return VSOutput(\n   filterVertexPosition(aPosition),\n   filterTextureCoord(aPosition),\n   getFilterCoord(aPosition)\n  );\n}\n\n@fragment\nfn mainFragment(\n  @location(0) uv: vec2<f32>,\n  @location(1) filterUv: vec2<f32>,\n  @builtin(position) position: vec4<f32>\n) -> @location(0) vec4<f32> {\n\n    var maskClamp = filterUniforms.uMaskClamp;\n    var uAlpha = filterUniforms.uAlpha;\n\n    var clip = step(3.5,\n      step(maskClamp.x, filterUv.x) +\n      step(maskClamp.y, filterUv.y) +\n      step(filterUv.x, maskClamp.z) +\n      step(filterUv.y, maskClamp.w));\n\n    var mask = textureSample(uMaskTexture, uSampler, filterUv);\n    var source = textureSample(uTexture, uSampler, uv);\n    var alphaMul = 1.0 - uAlpha * (1.0 - mask.a);\n\n    var a: f32 = alphaMul * mask.r * uAlpha * clip;\n\n    if (filterUniforms.uInverse == 1.0) {\n        a = 1.0 - a;\n    }\n\n    return source * a;\n}\n";
;
 //# sourceMappingURL=mask.wgsl.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/MaskFilter.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MaskFilter",
    ()=>MaskFilter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureMatrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureMatrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$Filter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/Filter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$frag$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.frag.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$vert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.vert.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$wgsl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.wgsl.mjs [app-ssr] (ecmascript)");
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
class MaskFilter extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$Filter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Filter"] {
    constructor(options){
        const { sprite, ...rest } = options;
        const textureMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureMatrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureMatrix"](sprite.texture);
        const filterUniforms = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
            uFilterMatrix: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            uMaskClamp: {
                value: textureMatrix.uClampFrame,
                type: "vec4<f32>"
            },
            uAlpha: {
                value: 1,
                type: "f32"
            },
            uInverse: {
                value: options.inverse ? 1 : 0,
                type: "f32"
            }
        });
        const gpuProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuProgram"].from({
            vertex: {
                source: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$wgsl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
                entryPoint: "mainVertex"
            },
            fragment: {
                source: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$wgsl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
                entryPoint: "mainFragment"
            }
        });
        const glProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlProgram"].from({
            vertex: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$vert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
            fragment: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$frag$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
            name: "mask-filter"
        });
        super({
            ...rest,
            gpuProgram,
            glProgram,
            clipToViewport: false,
            resources: {
                filterUniforms,
                uMaskTexture: sprite.texture.source
            }
        });
        this.sprite = sprite;
        this._textureMatrix = textureMatrix;
    }
    set inverse(value) {
        this.resources.filterUniforms.uniforms.uInverse = value ? 1 : 0;
    }
    get inverse() {
        return this.resources.filterUniforms.uniforms.uInverse === 1;
    }
    apply(filterManager, input, output, clearMode) {
        this._textureMatrix.texture = this.sprite.texture;
        filterManager.calculateSpriteMatrix(this.resources.filterUniforms.uniforms.uFilterMatrix, this.sprite).prepend(this._textureMatrix.mapCoord);
        this.resources.uMaskTexture = this.sprite.texture.source;
        filterManager.applyFilter(this, input, output, clearMode);
    }
}
;
 //# sourceMappingURL=MaskFilter.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/alpha/AlphaMaskPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlphaMaskPipe",
    ()=>AlphaMaskPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterEffect$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/FilterEffect.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$MaskFilter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/MaskFilter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getGlobalBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getGlobalBounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$Sprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/Sprite.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TexturePool.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-ssr] (ecmascript)");
;
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
const tempBounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bounds"]();
class AlphaMaskEffect extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterEffect$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FilterEffect"] {
    constructor(){
        super();
        this.filters = [
            new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$MaskFilter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MaskFilter"]({
                sprite: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$Sprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sprite"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY),
                inverse: false,
                resolution: "inherit",
                antialias: "inherit"
            })
        ];
    }
    get sprite() {
        return this.filters[0].sprite;
    }
    set sprite(value) {
        this.filters[0].sprite = value;
    }
    get inverse() {
        return this.filters[0].inverse;
    }
    set inverse(value) {
        this.filters[0].inverse = value;
    }
}
class AlphaMaskPipe {
    constructor(renderer){
        this._activeMaskStage = [];
        this._renderer = renderer;
    }
    push(mask, maskedContainer, instructionSet) {
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "alphaMask",
            action: "pushMaskBegin",
            mask,
            inverse: maskedContainer._maskOptions.inverse,
            canBundle: false,
            maskedContainer
        });
        mask.inverse = maskedContainer._maskOptions.inverse;
        if (mask.renderMaskToTexture) {
            const maskContainer = mask.mask;
            maskContainer.includeInBuild = true;
            maskContainer.collectRenderables(instructionSet, renderer, null);
            maskContainer.includeInBuild = false;
        }
        renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "alphaMask",
            action: "pushMaskEnd",
            mask,
            maskedContainer,
            inverse: maskedContainer._maskOptions.inverse,
            canBundle: false
        });
    }
    pop(mask, _maskedContainer, instructionSet) {
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "alphaMask",
            action: "popMaskEnd",
            mask,
            inverse: _maskedContainer._maskOptions.inverse,
            canBundle: false
        });
    }
    execute(instruction) {
        const renderer = this._renderer;
        const renderMask = instruction.mask.renderMaskToTexture;
        if (instruction.action === "pushMaskBegin") {
            const filterEffect = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].get(AlphaMaskEffect);
            filterEffect.inverse = instruction.inverse;
            if (renderMask) {
                instruction.mask.mask.measurable = true;
                const bounds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getGlobalBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getGlobalBounds"])(instruction.mask.mask, true, tempBounds);
                instruction.mask.mask.measurable = false;
                bounds.ceil();
                const colorTextureSource = renderer.renderTarget.renderTarget.colorTexture.source;
                const filterTexture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].getOptimalTexture(bounds.width, bounds.height, colorTextureSource._resolution, colorTextureSource.antialias);
                renderer.renderTarget.push(filterTexture, true);
                renderer.globalUniforms.push({
                    offset: bounds,
                    worldColor: 4294967295
                });
                const sprite = filterEffect.sprite;
                sprite.texture = filterTexture;
                sprite.worldTransform.tx = bounds.minX;
                sprite.worldTransform.ty = bounds.minY;
                this._activeMaskStage.push({
                    filterEffect,
                    maskedContainer: instruction.maskedContainer,
                    filterTexture
                });
            } else {
                filterEffect.sprite = instruction.mask.mask;
                this._activeMaskStage.push({
                    filterEffect,
                    maskedContainer: instruction.maskedContainer
                });
            }
        } else if (instruction.action === "pushMaskEnd") {
            const maskData = this._activeMaskStage[this._activeMaskStage.length - 1];
            if (renderMask) {
                if (renderer.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererType"].WEBGL) {
                    renderer.renderTarget.finishRenderPass();
                }
                renderer.renderTarget.pop();
                renderer.globalUniforms.pop();
            }
            renderer.filter.push({
                renderPipeId: "filter",
                action: "pushFilter",
                container: maskData.maskedContainer,
                filterEffect: maskData.filterEffect,
                canBundle: false
            });
        } else if (instruction.action === "popMaskEnd") {
            renderer.filter.pop();
            const maskData = this._activeMaskStage.pop();
            if (renderMask) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(maskData.filterTexture);
            }
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].return(maskData.filterEffect);
        }
    }
    destroy() {
        this._renderer = null;
        this._activeMaskStage = null;
    }
}
/** @ignore */ AlphaMaskPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "alphaMask"
};
;
 //# sourceMappingURL=AlphaMaskPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/color/ColorMaskPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ColorMaskPipe",
    ()=>ColorMaskPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class ColorMaskPipe {
    constructor(renderer){
        this._colorStack = [];
        this._colorStackIndex = 0;
        this._currentColor = 0;
        this._renderer = renderer;
    }
    buildStart() {
        this._colorStack[0] = 15;
        this._colorStackIndex = 1;
        this._currentColor = 15;
    }
    push(mask, _container, instructionSet) {
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        const colorStack = this._colorStack;
        colorStack[this._colorStackIndex] = colorStack[this._colorStackIndex - 1] & mask.mask;
        const currentColor = this._colorStack[this._colorStackIndex];
        if (currentColor !== this._currentColor) {
            this._currentColor = currentColor;
            instructionSet.add({
                renderPipeId: "colorMask",
                colorMask: currentColor,
                canBundle: false
            });
        }
        this._colorStackIndex++;
    }
    pop(_mask, _container, instructionSet) {
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        const colorStack = this._colorStack;
        this._colorStackIndex--;
        const currentColor = colorStack[this._colorStackIndex - 1];
        if (currentColor !== this._currentColor) {
            this._currentColor = currentColor;
            instructionSet.add({
                renderPipeId: "colorMask",
                colorMask: currentColor,
                canBundle: false
            });
        }
    }
    execute(instruction) {
        const renderer = this._renderer;
        renderer.colorMask.setMask(instruction.colorMask);
    }
    destroy() {
        this._renderer = null;
        this._colorStack = null;
    }
}
/** @ignore */ ColorMaskPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "colorMask"
};
;
 //# sourceMappingURL=ColorMaskPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/stencil/StencilMaskPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StencilMaskPipe",
    ()=>StencilMaskPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/const.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class StencilMaskPipe {
    constructor(renderer){
        // used when building and also when executing..
        this._maskStackHash = {};
        this._maskHash = /* @__PURE__ */ new WeakMap();
        this._renderer = renderer;
    }
    push(mask, _container, instructionSet) {
        var _a;
        const effect = mask;
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        renderer.renderPipes.blendMode.setBlendMode(effect.mask, "none", instructionSet);
        instructionSet.add({
            renderPipeId: "stencilMask",
            action: "pushMaskBegin",
            mask,
            inverse: _container._maskOptions.inverse,
            canBundle: false
        });
        const maskContainer = effect.mask;
        maskContainer.includeInBuild = true;
        if (!this._maskHash.has(effect)) {
            this._maskHash.set(effect, {
                instructionsStart: 0,
                instructionsLength: 0
            });
        }
        const maskData = this._maskHash.get(effect);
        maskData.instructionsStart = instructionSet.instructionSize;
        maskContainer.collectRenderables(instructionSet, renderer, null);
        maskContainer.includeInBuild = false;
        renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "stencilMask",
            action: "pushMaskEnd",
            mask,
            inverse: _container._maskOptions.inverse,
            canBundle: false
        });
        const instructionsLength = instructionSet.instructionSize - maskData.instructionsStart - 1;
        maskData.instructionsLength = instructionsLength;
        const renderTargetUid = renderer.renderTarget.renderTarget.uid;
        (_a = this._maskStackHash)[renderTargetUid] ?? (_a[renderTargetUid] = 0);
    }
    pop(mask, _container, instructionSet) {
        const effect = mask;
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        renderer.renderPipes.blendMode.setBlendMode(effect.mask, "none", instructionSet);
        instructionSet.add({
            renderPipeId: "stencilMask",
            action: "popMaskBegin",
            inverse: _container._maskOptions.inverse,
            canBundle: false
        });
        const maskData = this._maskHash.get(mask);
        for(let i = 0; i < maskData.instructionsLength; i++){
            instructionSet.instructions[instructionSet.instructionSize++] = instructionSet.instructions[maskData.instructionsStart++];
        }
        instructionSet.add({
            renderPipeId: "stencilMask",
            action: "popMaskEnd",
            canBundle: false
        });
    }
    execute(instruction) {
        var _a;
        const renderer = this._renderer;
        const renderTargetUid = renderer.renderTarget.renderTarget.uid;
        let maskStackIndex = (_a = this._maskStackHash)[renderTargetUid] ?? (_a[renderTargetUid] = 0);
        if (instruction.action === "pushMaskBegin") {
            renderer.renderTarget.ensureDepthStencil();
            renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].RENDERING_MASK_ADD, maskStackIndex);
            maskStackIndex++;
            renderer.colorMask.setMask(0);
        } else if (instruction.action === "pushMaskEnd") {
            if (instruction.inverse) {
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].INVERSE_MASK_ACTIVE, maskStackIndex);
            } else {
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].MASK_ACTIVE, maskStackIndex);
            }
            renderer.colorMask.setMask(15);
        } else if (instruction.action === "popMaskBegin") {
            renderer.colorMask.setMask(0);
            if (maskStackIndex !== 0) {
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].RENDERING_MASK_REMOVE, maskStackIndex);
            } else {
                renderer.renderTarget.clear(null, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].STENCIL);
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].DISABLED, maskStackIndex);
            }
            maskStackIndex--;
        } else if (instruction.action === "popMaskEnd") {
            if (instruction.inverse) {
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].INVERSE_MASK_ACTIVE, maskStackIndex);
            } else {
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].MASK_ACTIVE, maskStackIndex);
            }
            renderer.colorMask.setMask(15);
        }
        this._maskStackHash[renderTargetUid] = maskStackIndex;
    }
    destroy() {
        this._renderer = null;
        this._maskStackHash = null;
        this._maskHash = null;
    }
}
StencilMaskPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "stencilMask"
};
;
 //# sourceMappingURL=StencilMaskPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/background/BackgroundSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BackgroundSystem",
    ()=>BackgroundSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const _BackgroundSystem = class _BackgroundSystem {
    constructor(){
        this.clearBeforeRender = true;
        this._backgroundColor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0);
        this.color = this._backgroundColor;
        this.alpha = 1;
    }
    /**
   * initiates the background system
   * @param options - the options for the background colors
   */ init(options) {
        options = {
            ..._BackgroundSystem.defaultOptions,
            ...options
        };
        this.clearBeforeRender = options.clearBeforeRender;
        this.color = options.background || options.backgroundColor || this._backgroundColor;
        this.alpha = options.backgroundAlpha;
        this._backgroundColor.setAlpha(options.backgroundAlpha);
    }
    /** The background color to fill if not transparent */ get color() {
        return this._backgroundColor;
    }
    set color(value) {
        const incoming = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"].shared.setValue(value);
        if (incoming.alpha < 1 && this._backgroundColor.alpha === 1) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("Cannot set a transparent background on an opaque canvas. To enable transparency, set backgroundAlpha < 1 when initializing your Application.");
        }
        this._backgroundColor.setValue(value);
    }
    /** The background color alpha. Setting this to 0 will make the canvas transparent. */ get alpha() {
        return this._backgroundColor.alpha;
    }
    set alpha(value) {
        this._backgroundColor.setAlpha(value);
    }
    /** The background color as an [R, G, B, A] array. */ get colorRgba() {
        return this._backgroundColor.toArray();
    }
    /**
   * destroys the background system
   * @internal
   */ destroy() {}
};
/** @ignore */ _BackgroundSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "background",
    priority: 0
};
/** default options used by the system */ _BackgroundSystem.defaultOptions = {
    /**
   * {@link WebGLOptions.backgroundAlpha}
   * @default 1
   */ backgroundAlpha: 1,
    /**
   * {@link WebGLOptions.backgroundColor}
   * @default 0x000000
   */ backgroundColor: 0,
    /**
   * {@link WebGLOptions.clearBeforeRender}
   * @default true
   */ clearBeforeRender: true
};
let BackgroundSystem = _BackgroundSystem;
;
 //# sourceMappingURL=BackgroundSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/blendModes/BlendModePipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BlendModePipe",
    ()=>BlendModePipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterEffect$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/FilterEffect.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
const BLEND_MODE_FILTERS = {};
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handle(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].BlendMode, (value)=>{
    if (!value.name) {
        throw new Error("BlendMode extension must have a name property");
    }
    BLEND_MODE_FILTERS[value.name] = value.ref;
}, (value)=>{
    delete BLEND_MODE_FILTERS[value.name];
});
class BlendModePipe {
    constructor(renderer){
        this._blendModeStack = [];
        this._isAdvanced = false;
        this._filterHash = /* @__PURE__ */ Object.create(null);
        this._renderer = renderer;
        this._renderer.runners.prerender.add(this);
    }
    prerender() {
        this._activeBlendMode = "normal";
        this._isAdvanced = false;
    }
    /**
   * Push a blend mode onto the internal stack and apply it to the instruction set if needed.
   * @param renderable - The renderable or {@link RenderGroup} associated with the change.
   * @param blendMode - The blend mode to activate.
   * @param instructionSet - The instruction set being built.
   */ pushBlendMode(renderable, blendMode, instructionSet) {
        this._blendModeStack.push(blendMode);
        this.setBlendMode(renderable, blendMode, instructionSet);
    }
    /**
   * Pop the last blend mode from the stack and apply the new top-of-stack mode.
   * @param instructionSet - The instruction set being built.
   */ popBlendMode(instructionSet) {
        this._blendModeStack.pop();
        const blendMode = this._blendModeStack[this._activeBlendMode.length - 1] ?? "normal";
        this.setBlendMode(null, blendMode, instructionSet);
    }
    /**
   * Ensure a blend mode switch is added to the instruction set when the mode changes.
   * If an advanced blend mode is active, subsequent renderables will be collected so they can be
   * rendered within a single filter pass.
   * @param renderable - The renderable or {@link RenderGroup} to associate with the change, or null when unwinding.
   * @param blendMode - The target blend mode.
   * @param instructionSet - The instruction set being built.
   */ setBlendMode(renderable, blendMode, instructionSet) {
        const isRenderGroup = renderable instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderGroup"];
        if (this._activeBlendMode === blendMode) {
            if (this._isAdvanced && renderable && !isRenderGroup) {
                this._renderableList?.push(renderable);
            }
            return;
        }
        if (this._isAdvanced) this._endAdvancedBlendMode(instructionSet);
        this._activeBlendMode = blendMode;
        if (!renderable) return;
        this._isAdvanced = !!BLEND_MODE_FILTERS[blendMode];
        if (this._isAdvanced) this._beginAdvancedBlendMode(renderable, instructionSet);
    }
    _beginAdvancedBlendMode(renderable, instructionSet) {
        this._renderer.renderPipes.batch.break(instructionSet);
        const blendMode = this._activeBlendMode;
        if (!BLEND_MODE_FILTERS[blendMode]) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`Unable to assign BlendMode: '${blendMode}'. You may want to include: import 'pixi.js/advanced-blend-modes'`);
            return;
        }
        const filterEffect = this._ensureFilterEffect(blendMode);
        const isRenderGroup = renderable instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderGroup"];
        const instruction = {
            renderPipeId: "filter",
            action: "pushFilter",
            filterEffect,
            renderables: isRenderGroup ? null : [
                renderable
            ],
            container: isRenderGroup ? renderable.root : null,
            canBundle: false
        };
        this._renderableList = instruction.renderables;
        instructionSet.add(instruction);
    }
    _ensureFilterEffect(blendMode) {
        let filterEffect = this._filterHash[blendMode];
        if (!filterEffect) {
            filterEffect = this._filterHash[blendMode] = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterEffect$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FilterEffect"]();
            filterEffect.filters = [
                new BLEND_MODE_FILTERS[blendMode]()
            ];
        }
        return filterEffect;
    }
    _endAdvancedBlendMode(instructionSet) {
        this._isAdvanced = false;
        this._renderableList = null;
        this._renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "filter",
            action: "popFilter",
            canBundle: false
        });
    }
    /**
   * called when the instruction build process is starting this will reset internally to the default blend mode
   * @internal
   */ buildStart() {
        this._isAdvanced = false;
    }
    /**
   * called when the instruction build process is finished, ensuring that if there is an advanced blend mode
   * active, we add the final render instructions added to the instruction set
   * @param instructionSet - The instruction set we are adding to
   * @internal
   */ buildEnd(instructionSet) {
        if (!this._isAdvanced) return;
        this._endAdvancedBlendMode(instructionSet);
    }
    /** @internal */ destroy() {
        this._renderer = null;
        this._renderableList = null;
        for(const i in this._filterHash){
            this._filterHash[i].destroy();
        }
        this._filterHash = null;
    }
}
/** @ignore */ BlendModePipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "blendMode"
};
;
 //# sourceMappingURL=BlendModePipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/extract/ExtractSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ExtractSystem",
    ()=>ExtractSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/Container.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
const imageTypes = {
    png: "image/png",
    jpg: "image/jpeg",
    webp: "image/webp"
};
const _ExtractSystem = class _ExtractSystem {
    /** @param renderer - The renderer this System works for. */ constructor(renderer){
        this._renderer = renderer;
    }
    _normalizeOptions(options, defaults = {}) {
        if (options instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Container"] || options instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]) {
            return {
                target: options,
                ...defaults
            };
        }
        return {
            ...defaults,
            ...options
        };
    }
    /**
   * Creates an IImage from a display object or texture.
   * @param options - Options for creating the image, or the target to extract
   * @returns Promise that resolves with the generated IImage
   * @example
   * ```ts
   * // Basic usage with a sprite
   * const sprite = new Sprite(texture);
   * const image = await renderer.extract.image(sprite);
   * document.body.appendChild(image);
   *
   * // Advanced usage with options
   * const image = await renderer.extract.image({
   *     target: container,
   *     format: 'webp',
   *     quality: 0.8,
   *     frame: new Rectangle(0, 0, 100, 100),
   *     resolution: 2,
   *     clearColor: '#ff0000',
   *     antialias: true
   * });
   *
   * // Extract directly from a texture
   * const texture = Texture.from('myTexture.png');
   * const image = await renderer.extract.image(texture);
   * ```
   * @see {@link ExtractImageOptions} For detailed options
   * @see {@link ExtractSystem.base64} For base64 string output
   * @see {@link ExtractSystem.canvas} For canvas output
   * @see {@link ImageLike} For the image interface
   * @category rendering
   */ async image(options) {
        const image = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createImage();
        image.src = await this.base64(options);
        return image;
    }
    /**
   * Converts the target into a base64 encoded string.
   *
   * This method works by first creating
   * a canvas using `Extract.canvas` and then converting it to a base64 string.
   * @param options - The options for creating the base64 string, or the target to extract
   * @returns Promise that resolves with the base64 encoded string
   * @example
   * ```ts
   * // Basic usage with a sprite
   * const sprite = new Sprite(texture);
   * const base64 = await renderer.extract.base64(sprite);
   * console.log(base64); // data:image/png;base64,...
   *
   * // Advanced usage with options
   * const base64 = await renderer.extract.base64({
   *     target: container,
   *     format: 'webp',
   *     quality: 0.8,
   *     frame: new Rectangle(0, 0, 100, 100),
   *     resolution: 2
   * });
   * ```
   * @throws Will throw an error if the platform doesn't support any of:
   * - ICanvas.toDataURL
   * - ICanvas.toBlob
   * - ICanvas.convertToBlob
   * @see {@link ExtractImageOptions} For detailed options
   * @see {@link ExtractSystem.canvas} For canvas output
   * @see {@link ExtractSystem.image} For HTMLImage output
   * @category rendering
   */ async base64(options) {
        options = this._normalizeOptions(options, _ExtractSystem.defaultImageOptions);
        const { format, quality } = options;
        const canvas = this.canvas(options);
        if (canvas.toBlob !== void 0) {
            return new Promise((resolve, reject)=>{
                canvas.toBlob((blob)=>{
                    if (!blob) {
                        reject(new Error("ICanvas.toBlob failed!"));
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = ()=>resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }, imageTypes[format], quality);
            });
        }
        if (canvas.toDataURL !== void 0) {
            return canvas.toDataURL(imageTypes[format], quality);
        }
        if (canvas.convertToBlob !== void 0) {
            const blob = await canvas.convertToBlob({
                type: imageTypes[format],
                quality
            });
            return new Promise((resolve, reject)=>{
                const reader = new FileReader();
                reader.onload = ()=>resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        throw new Error("Extract.base64() requires ICanvas.toDataURL, ICanvas.toBlob, or ICanvas.convertToBlob to be implemented");
    }
    /**
   * Creates a Canvas element, renders the target to it and returns it.
   * This method is useful for creating static images or when you need direct canvas access.
   * @param options - The options for creating the canvas, or the target to extract
   * @returns A Canvas element with the texture rendered on
   * @example
   * ```ts
   * // Basic canvas extraction from a sprite
   * const sprite = new Sprite(texture);
   * const canvas = renderer.extract.canvas(sprite);
   * document.body.appendChild(canvas);
   *
   * // Extract with custom region
   * const canvas = renderer.extract.canvas({
   *     target: container,
   *     frame: new Rectangle(0, 0, 100, 100)
   * });
   *
   * // Extract with high resolution
   * const canvas = renderer.extract.canvas({
   *     target: sprite,
   *     resolution: 2,
   *     clearColor: '#ff0000'
   * });
   *
   * // Extract directly from a texture
   * const texture = Texture.from('myTexture.png');
   * const canvas = renderer.extract.canvas(texture);
   *
   * // Extract with anti-aliasing
   * const canvas = renderer.extract.canvas({
   *     target: graphics,
   *     antialias: true
   * });
   * ```
   * @see {@link ExtractOptions} For detailed options
   * @see {@link ExtractSystem.image} For HTMLImage output
   * @see {@link ExtractSystem.pixels} For raw pixel data
   * @category rendering
   */ canvas(options) {
        options = this._normalizeOptions(options);
        const target = options.target;
        const renderer = this._renderer;
        if (target instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]) {
            return renderer.texture.generateCanvas(target);
        }
        const texture = renderer.textureGenerator.generateTexture(options);
        const canvas = renderer.texture.generateCanvas(texture);
        texture.destroy(true);
        return canvas;
    }
    /**
   * Returns a one-dimensional array containing the pixel data of the entire texture in RGBA order,
   * with integer values between 0 and 255 (inclusive).
   * > [!NOE] The returned array is a flat Uint8Array where every 4 values represent RGBA
   * @param options - The options for extracting the image, or the target to extract
   * @returns One-dimensional Uint8Array containing the pixel data in RGBA format
   * @example
   * ```ts
   * // Basic pixel extraction
   * const sprite = new Sprite(texture);
   * const pixels = renderer.extract.pixels(sprite);
   * console.log(pixels[0], pixels[1], pixels[2], pixels[3]); // R,G,B,A values
   *
   * // Extract with custom region
   * const pixels = renderer.extract.pixels({
   *     target: sprite,
   *     frame: new Rectangle(0, 0, 100, 100)
   * });
   *
   * // Extract with high resolution
   * const pixels = renderer.extract.pixels({
   *     target: sprite,
   *     resolution: 2
   * });
   * ```
   * @see {@link ExtractOptions} For detailed options
   * @see {@link ExtractSystem.canvas} For canvas output
   * @see {@link ExtractSystem.image} For image output
   * @category rendering
   */ pixels(options) {
        options = this._normalizeOptions(options);
        const target = options.target;
        const renderer = this._renderer;
        const texture = target instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"] ? target : renderer.textureGenerator.generateTexture(options);
        const pixelInfo = renderer.texture.getPixels(texture);
        if (target instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Container"]) {
            texture.destroy(true);
        }
        return pixelInfo;
    }
    /**
   * Creates a texture from a display object or existing texture.
   *
   * This is useful for creating
   * reusable textures from rendered content or making copies of existing textures.
   * > [!NOTE] The returned texture should be destroyed when no longer needed
   * @param options - The options for creating the texture, or the target to extract
   * @returns A new texture containing the extracted content
   * @example
   * ```ts
   * // Basic texture extraction from a sprite
   * const sprite = new Sprite(texture);
   * const extractedTexture = renderer.extract.texture(sprite);
   *
   * // Extract with custom region
   * const regionTexture = renderer.extract.texture({
   *     target: container,
   *     frame: new Rectangle(0, 0, 100, 100)
   * });
   *
   * // Extract with high resolution
   * const hiResTexture = renderer.extract.texture({
   *     target: sprite,
   *     resolution: 2,
   *     clearColor: '#ff0000'
   * });
   *
   * // Create a new sprite from extracted texture
   * const newSprite = new Sprite(
   *     renderer.extract.texture({
   *         target: graphics,
   *         antialias: true
   *     })
   * );
   *
   * // Clean up when done
   * extractedTexture.destroy(true);
   * ```
   * @see {@link ExtractOptions} For detailed options
   * @see {@link Texture} For texture management
   * @see {@link GenerateTextureSystem} For texture generation
   * @category rendering
   */ texture(options) {
        options = this._normalizeOptions(options);
        if (options.target instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]) return options.target;
        return this._renderer.textureGenerator.generateTexture(options);
    }
    /**
   * Extracts and downloads content from the renderer as an image file.
   * This is a convenient way to save screenshots or export rendered content.
   * > [!NOTE] The download will use PNG format regardless of the filename extension
   * @param options - The options for downloading and extracting the image, or the target to extract
   * @example
   * ```ts
   * // Basic download with default filename
   * const sprite = new Sprite(texture);
   * renderer.extract.download(sprite); // Downloads as 'image.png'
   *
   * // Download with custom filename
   * renderer.extract.download({
   *     target: sprite,
   *     filename: 'screenshot.png'
   * });
   *
   * // Download with custom region
   * renderer.extract.download({
   *     target: container,
   *     filename: 'region.png',
   *     frame: new Rectangle(0, 0, 100, 100)
   * });
   *
   * // Download with high resolution and background
   * renderer.extract.download({
   *     target: stage,
   *     filename: 'hd-screenshot.png',
   *     resolution: 2,
   *     clearColor: '#ff0000'
   * });
   *
   * // Download with anti-aliasing
   * renderer.extract.download({
   *     target: graphics,
   *     filename: 'smooth.png',
   *     antialias: true
   * });
   * ```
   * @see {@link ExtractDownloadOptions} For detailed options
   * @see {@link ExtractSystem.image} For creating images without download
   * @see {@link ExtractSystem.canvas} For canvas output
   * @category rendering
   */ download(options) {
        options = this._normalizeOptions(options);
        const canvas = this.canvas(options);
        const link = document.createElement("a");
        link.download = options.filename ?? "image.png";
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    /**
   * Logs the target to the console as an image. This is a useful way to debug what's happening in the renderer.
   * The image will be displayed in the browser's console using CSS background images.
   * @param options - The options for logging the image, or the target to log
   * @param options.width - The width of the logged image preview in the console (in pixels)
   * @example
   * ```ts
   * // Basic usage
   * const sprite = new Sprite(texture);
   * renderer.extract.log(sprite);
   * ```
   * @see {@link ExtractSystem.canvas} For getting raw canvas output
   * @see {@link ExtractSystem.pixels} For raw pixel data
   * @category rendering
   * @advanced
   */ log(options) {
        const width = options.width ?? 200;
        options = this._normalizeOptions(options);
        const canvas = this.canvas(options);
        const base64 = canvas.toDataURL();
        console.log(`[Pixi Texture] ${canvas.width}px ${canvas.height}px`);
        const style = [
            "font-size: 1px;",
            `padding: ${width}px ${300}px;`,
            `background: url(${base64}) no-repeat;`,
            "background-size: contain;"
        ].join(" ");
        console.log("%c ", style);
    }
    destroy() {
        this._renderer = null;
    }
};
/** @ignore */ _ExtractSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "extract"
};
/**
 * Default options for image extraction.
 * @example
 * ```ts
 * // Customize default options
 * ExtractSystem.defaultImageOptions.format = 'webp';
 * ExtractSystem.defaultImageOptions.quality = 0.8;
 *
 * // Use defaults
 * const image = await renderer.extract.image(sprite);
 * ```
 */ _ExtractSystem.defaultImageOptions = {
    format: "png",
    quality: 1
};
let ExtractSystem = _ExtractSystem;
;
 //# sourceMappingURL=ExtractSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/RenderTexture.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderTexture",
    ()=>RenderTexture
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class RenderTexture extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"] {
    static create(options) {
        return new RenderTexture({
            source: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"](options)
        });
    }
    /**
   * Resizes the render texture.
   * @param width - The new width of the render texture.
   * @param height - The new height of the render texture.
   * @param resolution - The new resolution of the render texture.
   * @returns This texture.
   */ resize(width, height, resolution) {
        this.source.resize(width, height, resolution);
        return this;
    }
}
;
 //# sourceMappingURL=RenderTexture.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/extract/GenerateTextureSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GenerateTextureSystem",
    ()=>GenerateTextureSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getLocalBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getLocalBounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/Container.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$RenderTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/RenderTexture.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
"use strict";
const tempRect = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"]();
const tempBounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bounds"]();
const noColor = [
    0,
    0,
    0,
    0
];
class GenerateTextureSystem {
    constructor(renderer){
        this._renderer = renderer;
    }
    /**
   * Creates a texture from a display object that can be used for creating sprites and other textures.
   * This is particularly useful for optimizing performance when a complex container needs to be reused.
   * @param options - Generate texture options or a container to convert to texture
   * @returns A new RenderTexture containing the rendered display object
   * @example
   * ```ts
   * // Basic usage with a container
   * const container = new Container();
   * container.addChild(
   *     new Graphics()
   *         .circle(0, 0, 50)
   *         .fill('red')
   * );
   *
   * const texture = renderer.textureGenerator.generateTexture(container);
   *
   * // Advanced usage with options
   * const texture = renderer.textureGenerator.generateTexture({
   *     target: container,
   *     frame: new Rectangle(0, 0, 100, 100), // Specific region
   *     resolution: 2,                        // High DPI
   *     clearColor: '#ff0000',               // Red background
   *     antialias: true                      // Smooth edges
   * });
   *
   * // Create a sprite from the generated texture
   * const sprite = new Sprite(texture);
   *
   * // Clean up when done
   * texture.destroy(true);
   * ```
   * @see {@link GenerateTextureOptions} For detailed texture generation options
   * @see {@link RenderTexture} For the type of texture created
   * @category rendering
   */ generateTexture(options) {
        if (options instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Container"]) {
            options = {
                target: options,
                frame: void 0,
                textureSourceOptions: {},
                resolution: void 0
            };
        }
        const resolution = options.resolution || this._renderer.resolution;
        const antialias = options.antialias || this._renderer.view.antialias;
        const container = options.target;
        let clearColor = options.clearColor;
        if (clearColor) {
            const isRGBAArray = Array.isArray(clearColor) && clearColor.length === 4;
            clearColor = isRGBAArray ? clearColor : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"].shared.setValue(clearColor).toArray();
        } else {
            clearColor = noColor;
        }
        const region = options.frame?.copyTo(tempRect) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getLocalBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLocalBounds"])(container, tempBounds).rectangle;
        region.width = Math.max(region.width, 1 / resolution) | 0;
        region.height = Math.max(region.height, 1 / resolution) | 0;
        const target = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$RenderTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderTexture"].create({
            ...options.textureSourceOptions,
            width: region.width,
            height: region.height,
            resolution,
            antialias
        });
        const transform = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"].shared.translate(-region.x, -region.y);
        this._renderer.render({
            container,
            transform,
            target,
            clearColor
        });
        target.source.updateMipmaps();
        return target;
    }
    destroy() {
        this._renderer = null;
    }
}
/** @ignore */ GenerateTextureSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "textureGenerator"
};
;
 //# sourceMappingURL=GenerateTextureSystem.mjs.map
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
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/GlobalUniformSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlobalUniformSystem",
    ()=>GlobalUniformSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/Point.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gpu/colorToUniform.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/BindGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
class GlobalUniformSystem {
    constructor(renderer){
        this._stackIndex = 0;
        this._globalUniformDataStack = [];
        this._uniformsPool = [];
        this._activeUniforms = [];
        this._bindGroupPool = [];
        this._activeBindGroups = [];
        this._renderer = renderer;
    }
    reset() {
        this._stackIndex = 0;
        for(let i = 0; i < this._activeUniforms.length; i++){
            this._uniformsPool.push(this._activeUniforms[i]);
        }
        for(let i = 0; i < this._activeBindGroups.length; i++){
            this._bindGroupPool.push(this._activeBindGroups[i]);
        }
        this._activeUniforms.length = 0;
        this._activeBindGroups.length = 0;
    }
    start(options) {
        this.reset();
        this.push(options);
    }
    bind({ size, projectionMatrix, worldTransformMatrix, worldColor, offset }) {
        const renderTarget = this._renderer.renderTarget.renderTarget;
        const currentGlobalUniformData = this._stackIndex ? this._globalUniformDataStack[this._stackIndex - 1] : {
            projectionData: renderTarget,
            worldTransformMatrix: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
            worldColor: 4294967295,
            offset: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Point"]()
        };
        const globalUniformData = {
            projectionMatrix: projectionMatrix || this._renderer.renderTarget.projectionMatrix,
            resolution: size || renderTarget.size,
            worldTransformMatrix: worldTransformMatrix || currentGlobalUniformData.worldTransformMatrix,
            worldColor: worldColor || currentGlobalUniformData.worldColor,
            offset: offset || currentGlobalUniformData.offset,
            bindGroup: null
        };
        const uniformGroup = this._uniformsPool.pop() || this._createUniforms();
        this._activeUniforms.push(uniformGroup);
        const uniforms = uniformGroup.uniforms;
        uniforms.uProjectionMatrix = globalUniformData.projectionMatrix;
        uniforms.uResolution = globalUniformData.resolution;
        uniforms.uWorldTransformMatrix.copyFrom(globalUniformData.worldTransformMatrix);
        uniforms.uWorldTransformMatrix.tx -= globalUniformData.offset.x;
        uniforms.uWorldTransformMatrix.ty -= globalUniformData.offset.y;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["color32BitToUniform"])(globalUniformData.worldColor, uniforms.uWorldColorAlpha, 0);
        uniformGroup.update();
        let bindGroup;
        if (this._renderer.renderPipes.uniformBatch) {
            bindGroup = this._renderer.renderPipes.uniformBatch.getUniformBindGroup(uniformGroup, false);
        } else {
            bindGroup = this._bindGroupPool.pop() || new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BindGroup"]();
            this._activeBindGroups.push(bindGroup);
            bindGroup.setResource(uniformGroup, 0);
        }
        globalUniformData.bindGroup = bindGroup;
        this._currentGlobalUniformData = globalUniformData;
    }
    push(options) {
        this.bind(options);
        this._globalUniformDataStack[this._stackIndex++] = this._currentGlobalUniformData;
    }
    pop() {
        this._currentGlobalUniformData = this._globalUniformDataStack[--this._stackIndex - 1];
        if (this._renderer.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererType"].WEBGL) {
            this._currentGlobalUniformData.bindGroup.resources[0].update();
        }
    }
    get bindGroup() {
        return this._currentGlobalUniformData.bindGroup;
    }
    get globalUniformData() {
        return this._currentGlobalUniformData;
    }
    get uniformGroup() {
        return this._currentGlobalUniformData.bindGroup.resources[0];
    }
    _createUniforms() {
        const globalUniforms = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
            uProjectionMatrix: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            uWorldTransformMatrix: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            // TODO - someone smart - set this to be a unorm8x4 rather than a vec4<f32>
            uWorldColorAlpha: {
                value: new Float32Array(4),
                type: "vec4<f32>"
            },
            uResolution: {
                value: [
                    0,
                    0
                ],
                type: "vec2<f32>"
            }
        }, {
            isStatic: true
        });
        return globalUniforms;
    }
    destroy() {
        this._renderer = null;
        this._globalUniformDataStack.length = 0;
        this._uniformsPool.length = 0;
        this._activeUniforms.length = 0;
        this._bindGroupPool.length = 0;
        this._activeBindGroups.length = 0;
        this._currentGlobalUniformData = null;
    }
}
/** @ignore */ GlobalUniformSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "globalUniforms"
};
;
 //# sourceMappingURL=GlobalUniformSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/SchedulerSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SchedulerSystem",
    ()=>SchedulerSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/ticker/Ticker.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
let uid = 1;
class SchedulerSystem {
    constructor(){
        this._tasks = [];
        /** a small off set to apply to the repeat schedules. This is just to make sure they run at slightly different times */ this._offset = 0;
    }
    /** Initializes the scheduler system and starts the ticker. */ init() {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Ticker"].system.add(this._update, this);
    }
    /**
   * Schedules a repeating task.
   * @param func - The function to execute.
   * @param duration - The interval duration in milliseconds.
   * @param useOffset - this will spread out tasks so that they do not all run at the same time
   * @returns The unique identifier for the scheduled task.
   */ repeat(func, duration, useOffset = true) {
        const id = uid++;
        let offset = 0;
        if (useOffset) {
            this._offset += 1e3;
            offset = this._offset;
        }
        this._tasks.push({
            func,
            duration,
            start: performance.now(),
            offset,
            last: performance.now(),
            repeat: true,
            id
        });
        return id;
    }
    /**
   * Cancels a scheduled task.
   * @param id - The unique identifier of the task to cancel.
   */ cancel(id) {
        for(let i = 0; i < this._tasks.length; i++){
            if (this._tasks[i].id === id) {
                this._tasks.splice(i, 1);
                return;
            }
        }
    }
    /**
   * Updates and executes the scheduled tasks.
   * @private
   */ _update() {
        const now = performance.now();
        for(let i = 0; i < this._tasks.length; i++){
            const task = this._tasks[i];
            if (now - task.offset - task.last >= task.duration) {
                const elapsed = now - task.start;
                task.func(elapsed);
                task.last = now;
            }
        }
    }
    /**
   * Destroys the scheduler system and removes all tasks.
   * @internal
   */ destroy() {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Ticker"].system.remove(this._update, this);
        this._tasks.length = 0;
    }
}
/** @ignore */ SchedulerSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "scheduler",
    priority: 0
};
;
 //# sourceMappingURL=SchedulerSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/sayHello.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sayHello",
    ()=>sayHello
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/const.mjs [app-ssr] (ecmascript) <locals>");
;
;
"use strict";
let saidHello = false;
function sayHello(type) {
    if (saidHello) {
        return;
    }
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getNavigator().userAgent.toLowerCase().indexOf("chrome") > -1) {
        const args = [
            `%c  %c  %c  %c  %c PixiJS %c v${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["VERSION"]} (${type}) http://www.pixijs.com/

`,
            "background: #E72264; padding:5px 0;",
            "background: #6CA2EA; padding:5px 0;",
            "background: #B5D33D; padding:5px 0;",
            "background: #FED23F; padding:5px 0;",
            "color: #FFFFFF; background: #E72264; padding:5px 0;",
            "color: #E72264; background: #FFFFFF; padding:5px 0;"
        ];
        globalThis.console.log(...args);
    } else if (globalThis.console) {
        globalThis.console.log(`PixiJS ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["VERSION"]} - ${type} - http://www.pixijs.com/`);
    }
    saidHello = true;
}
;
 //# sourceMappingURL=sayHello.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/startup/HelloSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HelloSystem",
    ()=>HelloSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$sayHello$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/sayHello.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class HelloSystem {
    constructor(renderer){
        this._renderer = renderer;
    }
    /**
   * It all starts here! This initiates every system, passing in the options for any system by name.
   * @param options - the config for the renderer and all its systems
   */ init(options) {
        if (options.hello) {
            let name = this._renderer.name;
            if (this._renderer.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererType"].WEBGL) {
                name += ` ${this._renderer.context.webGLVersion}`;
            }
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$sayHello$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sayHello"])(name);
        }
    }
}
/** @ignore */ HelloSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "hello",
    priority: -2
};
/** The default options for the system. */ HelloSystem.defaultOptions = {
    /** {@link WebGLOptions.hello} */ hello: false
};
;
 //# sourceMappingURL=HelloSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/clean.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cleanArray",
    ()=>cleanArray,
    "cleanHash",
    ()=>cleanHash
]);
"use strict";
function cleanHash(hash) {
    let clean = false;
    for(const i in hash){
        if (hash[i] == void 0) {
            clean = true;
            break;
        }
    }
    if (!clean) return hash;
    const cleanHash2 = /* @__PURE__ */ Object.create(null);
    for(const i in hash){
        const value = hash[i];
        if (value) {
            cleanHash2[i] = value;
        }
    }
    return cleanHash2;
}
function cleanArray(arr) {
    let offset = 0;
    for(let i = 0; i < arr.length; i++){
        if (arr[i] == void 0) {
            offset++;
        } else {
            arr[i - offset] = arr[i];
        }
    }
    arr.length -= offset;
    return arr;
}
;
 //# sourceMappingURL=clean.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/RenderableGCSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderableGCSystem",
    ()=>RenderableGCSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$clean$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/clean.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
let renderableGCTick = 0;
const _RenderableGCSystem = class _RenderableGCSystem {
    /**
   * Creates a new RenderableGCSystem instance.
   * @param renderer - The renderer this garbage collection system works for
   */ constructor(renderer){
        /** Array of renderables being tracked for garbage collection */ this._managedRenderables = [];
        /** Array of hash objects being tracked for cleanup */ this._managedHashes = [];
        /** Array of arrays being tracked for cleanup */ this._managedArrays = [];
        this._renderer = renderer;
    }
    /**
   * Initializes the garbage collection system with the provided options.
   * @param options - Configuration options for the renderer
   */ init(options) {
        options = {
            ..._RenderableGCSystem.defaultOptions,
            ...options
        };
        this.maxUnusedTime = options.renderableGCMaxUnusedTime;
        this._frequency = options.renderableGCFrequency;
        this.enabled = options.renderableGCActive;
    }
    /**
   * Gets whether the garbage collection system is currently enabled.
   * @returns True if GC is enabled, false otherwise
   */ get enabled() {
        return !!this._handler;
    }
    /**
   * Enables or disables the garbage collection system.
   * When enabled, schedules periodic cleanup of resources.
   * When disabled, cancels all scheduled cleanups.
   */ set enabled(value) {
        if (this.enabled === value) return;
        if (value) {
            this._handler = this._renderer.scheduler.repeat(()=>this.run(), this._frequency, false);
            this._hashHandler = this._renderer.scheduler.repeat(()=>{
                for (const hash of this._managedHashes){
                    hash.context[hash.hash] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$clean$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cleanHash"])(hash.context[hash.hash]);
                }
            }, this._frequency);
            this._arrayHandler = this._renderer.scheduler.repeat(()=>{
                for (const array of this._managedArrays){
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$clean$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cleanArray"])(array.context[array.hash]);
                }
            }, this._frequency);
        } else {
            this._renderer.scheduler.cancel(this._handler);
            this._renderer.scheduler.cancel(this._hashHandler);
            this._renderer.scheduler.cancel(this._arrayHandler);
        }
    }
    /**
   * Adds a hash table to be managed by the garbage collector.
   * @param context - The object containing the hash table
   * @param hash - The property name of the hash table
   */ addManagedHash(context, hash) {
        this._managedHashes.push({
            context,
            hash
        });
    }
    /**
   * Adds an array to be managed by the garbage collector.
   * @param context - The object containing the array
   * @param hash - The property name of the array
   */ addManagedArray(context, hash) {
        this._managedArrays.push({
            context,
            hash
        });
    }
    /**
   * Updates the GC timestamp and tracking before rendering.
   * @param options - The render options
   * @param options.container - The container to render
   */ prerender({ container }) {
        this._now = performance.now();
        container.renderGroup.gcTick = renderableGCTick++;
        this._updateInstructionGCTick(container.renderGroup, container.renderGroup.gcTick);
    }
    /**
   * Starts tracking a renderable for garbage collection.
   * @param renderable - The renderable to track
   */ addRenderable(renderable) {
        if (!this.enabled) return;
        if (renderable._lastUsed === -1) {
            this._managedRenderables.push(renderable);
            renderable.once("destroyed", this._removeRenderable, this);
        }
        renderable._lastUsed = this._now;
    }
    /**
   * Performs garbage collection by cleaning up unused renderables.
   * Removes renderables that haven't been used for longer than maxUnusedTime.
   */ run() {
        const now = this._now;
        const managedRenderables = this._managedRenderables;
        const renderPipes = this._renderer.renderPipes;
        let offset = 0;
        for(let i = 0; i < managedRenderables.length; i++){
            const renderable = managedRenderables[i];
            if (renderable === null) {
                offset++;
                continue;
            }
            const renderGroup = renderable.renderGroup ?? renderable.parentRenderGroup;
            const currentTick = renderGroup?.instructionSet?.gcTick ?? -1;
            if ((renderGroup?.gcTick ?? 0) === currentTick) {
                renderable._lastUsed = now;
            }
            if (now - renderable._lastUsed > this.maxUnusedTime) {
                if (!renderable.destroyed) {
                    const rp = renderPipes;
                    if (renderGroup) renderGroup.structureDidChange = true;
                    rp[renderable.renderPipeId].destroyRenderable(renderable);
                }
                renderable._lastUsed = -1;
                offset++;
                renderable.off("destroyed", this._removeRenderable, this);
            } else {
                managedRenderables[i - offset] = renderable;
            }
        }
        managedRenderables.length -= offset;
    }
    /** Cleans up the garbage collection system. Disables GC and removes all tracked resources. */ destroy() {
        this.enabled = false;
        this._renderer = null;
        this._managedRenderables.length = 0;
        this._managedHashes.length = 0;
        this._managedArrays.length = 0;
    }
    /**
   * Removes a renderable from being tracked when it's destroyed.
   * @param renderable - The renderable to stop tracking
   */ _removeRenderable(renderable) {
        const index = this._managedRenderables.indexOf(renderable);
        if (index >= 0) {
            renderable.off("destroyed", this._removeRenderable, this);
            this._managedRenderables[index] = null;
        }
    }
    /**
   * Updates the GC tick counter for a render group and its children.
   * @param renderGroup - The render group to update
   * @param gcTick - The new tick value
   */ _updateInstructionGCTick(renderGroup, gcTick) {
        renderGroup.instructionSet.gcTick = gcTick;
        for (const child of renderGroup.renderGroupChildren){
            this._updateInstructionGCTick(child, gcTick);
        }
    }
};
/**
 * Extension metadata for registering this system with the renderer.
 * @ignore
 */ _RenderableGCSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "renderableGC",
    priority: 0
};
/**
 * Default configuration options for the garbage collection system.
 * These can be overridden when initializing the renderer.
 */ _RenderableGCSystem.defaultOptions = {
    /** Enable/disable the garbage collector */ renderableGCActive: true,
    /** Time in ms before an unused resource is collected (default 1 minute) */ renderableGCMaxUnusedTime: 6e4,
    /** How often to run garbage collection in ms (default 30 seconds) */ renderableGCFrequency: 3e4
};
let RenderableGCSystem = _RenderableGCSystem;
;
 //# sourceMappingURL=RenderableGCSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureGCSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TextureGCSystem",
    ()=>TextureGCSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
const _TextureGCSystem = class _TextureGCSystem {
    /** @param renderer - The renderer this System works for. */ constructor(renderer){
        this._renderer = renderer;
        this.count = 0;
        this.checkCount = 0;
    }
    init(options) {
        options = {
            ..._TextureGCSystem.defaultOptions,
            ...options
        };
        this.checkCountMax = options.textureGCCheckCountMax;
        this.maxIdle = options.textureGCAMaxIdle ?? options.textureGCMaxIdle;
        this.active = options.textureGCActive;
    }
    /**
   * Checks to see when the last time a texture was used.
   * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
   */ postrender() {
        if (!this._renderer.renderingToScreen) {
            return;
        }
        this.count++;
        if (!this.active) return;
        this.checkCount++;
        if (this.checkCount > this.checkCountMax) {
            this.checkCount = 0;
            this.run();
        }
    }
    /**
   * Checks to see when the last time a texture was used.
   * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
   */ run() {
        const managedTextures = this._renderer.texture.managedTextures;
        for(let i = 0; i < managedTextures.length; i++){
            const texture = managedTextures[i];
            if (texture.autoGarbageCollect && texture.resource && texture._touched > -1 && this.count - texture._touched > this.maxIdle) {
                texture._touched = -1;
                texture.unload();
            }
        }
    }
    destroy() {
        this._renderer = null;
    }
};
/** @ignore */ _TextureGCSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "textureGC"
};
/** default options for the TextureGCSystem */ _TextureGCSystem.defaultOptions = {
    /**
   * If set to true, this will enable the garbage collector on the GPU.
   * @default true
   */ textureGCActive: true,
    /**
   * @deprecated since 8.3.0
   * @see {@link TextureGCSystemOptions.textureGCMaxIdle}
   */ textureGCAMaxIdle: null,
    /**
   * The maximum idle frames before a texture is destroyed by garbage collection.
   * @default 60 * 60
   */ textureGCMaxIdle: 60 * 60,
    /**
   * Frames between two garbage collections.
   * @default 600
   */ textureGCCheckCountMax: 600
};
let TextureGCSystem = _TextureGCSystem;
;
 //# sourceMappingURL=TextureGCSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/RenderTarget.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderTarget",
    ()=>RenderTarget
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const _RenderTarget = class _RenderTarget {
    /**
   * @param [descriptor] - Options for creating a render target.
   */ constructor(descriptor = {}){
        /** unique id for this render target */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uid"])("renderTarget");
        /**
     * An array of textures that can be written to by the GPU - mostly this has one texture in Pixi, but you could
     * write to multiple if required! (eg deferred lighting)
     */ this.colorTextures = [];
        this.dirtyId = 0;
        this.isRoot = false;
        this._size = new Float32Array(2);
        /** if true, then when the render target is destroyed, it will destroy all the textures that were created for it. */ this._managedColorTextures = false;
        descriptor = {
            ..._RenderTarget.defaultOptions,
            ...descriptor
        };
        this.stencil = descriptor.stencil;
        this.depth = descriptor.depth;
        this.isRoot = descriptor.isRoot;
        if (typeof descriptor.colorTextures === "number") {
            this._managedColorTextures = true;
            for(let i = 0; i < descriptor.colorTextures; i++){
                this.colorTextures.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"]({
                    width: descriptor.width,
                    height: descriptor.height,
                    resolution: descriptor.resolution,
                    antialias: descriptor.antialias
                }));
            }
        } else {
            this.colorTextures = [
                ...descriptor.colorTextures.map((texture)=>texture.source)
            ];
            const colorSource = this.colorTexture.source;
            this.resize(colorSource.width, colorSource.height, colorSource._resolution);
        }
        this.colorTexture.source.on("resize", this.onSourceResize, this);
        if (descriptor.depthStencilTexture || this.stencil) {
            if (descriptor.depthStencilTexture instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"] || descriptor.depthStencilTexture instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"]) {
                this.depthStencilTexture = descriptor.depthStencilTexture.source;
            } else {
                this.ensureDepthStencilTexture();
            }
        }
    }
    get size() {
        const _size = this._size;
        _size[0] = this.pixelWidth;
        _size[1] = this.pixelHeight;
        return _size;
    }
    get width() {
        return this.colorTexture.source.width;
    }
    get height() {
        return this.colorTexture.source.height;
    }
    get pixelWidth() {
        return this.colorTexture.source.pixelWidth;
    }
    get pixelHeight() {
        return this.colorTexture.source.pixelHeight;
    }
    get resolution() {
        return this.colorTexture.source._resolution;
    }
    get colorTexture() {
        return this.colorTextures[0];
    }
    onSourceResize(source) {
        this.resize(source.width, source.height, source._resolution, true);
    }
    /**
   * This will ensure a depthStencil texture is created for this render target.
   * Most likely called by the mask system to make sure we have stencil buffer added.
   * @internal
   */ ensureDepthStencilTexture() {
        if (!this.depthStencilTexture) {
            this.depthStencilTexture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"]({
                width: this.width,
                height: this.height,
                resolution: this.resolution,
                format: "depth24plus-stencil8",
                autoGenerateMipmaps: false,
                antialias: false,
                mipLevelCount: 1
            });
        }
    }
    resize(width, height, resolution = this.resolution, skipColorTexture = false) {
        this.dirtyId++;
        this.colorTextures.forEach((colorTexture, i)=>{
            if (skipColorTexture && i === 0) return;
            colorTexture.source.resize(width, height, resolution);
        });
        if (this.depthStencilTexture) {
            this.depthStencilTexture.source.resize(width, height, resolution);
        }
    }
    destroy() {
        this.colorTexture.source.off("resize", this.onSourceResize, this);
        if (this._managedColorTextures) {
            this.colorTextures.forEach((texture)=>{
                texture.destroy();
            });
        }
        if (this.depthStencilTexture) {
            this.depthStencilTexture.destroy();
            delete this.depthStencilTexture;
        }
    }
};
/** The default options for a render target */ _RenderTarget.defaultOptions = {
    /** the width of the RenderTarget */ width: 0,
    /** the height of the RenderTarget */ height: 0,
    /** the resolution of the RenderTarget */ resolution: 1,
    /** an array of textures, or a number indicating how many color textures there should be */ colorTextures: 1,
    /** should this render target have a stencil buffer? */ stencil: false,
    /** should this render target have a depth buffer? */ depth: false,
    /** should this render target be antialiased? */ antialias: false,
    // save on perf by default!
    /** is this a root element, true if this is gl context owners render target */ isRoot: false
};
let RenderTarget = _RenderTarget;
;
 //# sourceMappingURL=RenderTarget.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/getCanvasTexture.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCanvasTexture",
    ()=>getCanvasTexture,
    "hasCachedCanvasTexture",
    ()=>hasCachedCanvasTexture
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/GlobalResourceRegistry.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/CanvasSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const canvasCache = /* @__PURE__ */ new Map();
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlobalResourceRegistry"].register(canvasCache);
function getCanvasTexture(canvas, options) {
    if (!canvasCache.has(canvas)) {
        const texture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]({
            source: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasSource"]({
                resource: canvas,
                ...options
            })
        });
        const onDestroy = ()=>{
            if (canvasCache.get(canvas) === texture) {
                canvasCache.delete(canvas);
            }
        };
        texture.once("destroy", onDestroy);
        texture.source.once("destroy", onDestroy);
        canvasCache.set(canvas, texture);
    }
    return canvasCache.get(canvas);
}
function hasCachedCanvasTexture(canvas) {
    return canvasCache.has(canvas);
}
;
 //# sourceMappingURL=getCanvasTexture.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/view/ViewSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ViewSystem",
    ()=>ViewSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/RenderTarget.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$utils$2f$getCanvasTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/getCanvasTexture.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
"use strict";
const _ViewSystem = class _ViewSystem {
    /**
   * Whether CSS dimensions of canvas view should be resized to screen dimensions automatically.
   * This is only supported for HTMLCanvasElement and will be ignored if the canvas is an OffscreenCanvas.
   * @type {boolean}
   */ get autoDensity() {
        return this.texture.source.autoDensity;
    }
    set autoDensity(value) {
        this.texture.source.autoDensity = value;
    }
    /** The resolution / device pixel ratio of the renderer. */ get resolution() {
        return this.texture.source._resolution;
    }
    set resolution(value) {
        this.texture.source.resize(this.texture.source.width, this.texture.source.height, value);
    }
    /**
   * initiates the view system
   * @param options - the options for the view
   */ init(options) {
        options = {
            ..._ViewSystem.defaultOptions,
            ...options
        };
        if (options.view) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "ViewSystem.view has been renamed to ViewSystem.canvas");
            options.canvas = options.view;
        }
        this.screen = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"](0, 0, options.width, options.height);
        this.canvas = options.canvas || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas();
        this.antialias = !!options.antialias;
        this.texture = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$utils$2f$getCanvasTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCanvasTexture"])(this.canvas, options);
        this.renderTarget = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderTarget"]({
            colorTextures: [
                this.texture
            ],
            depth: !!options.depth,
            isRoot: true
        });
        this.texture.source.transparent = options.backgroundAlpha < 1;
        this.resolution = options.resolution;
    }
    /**
   * Resizes the screen and canvas to the specified dimensions.
   * @param desiredScreenWidth - The new width of the screen.
   * @param desiredScreenHeight - The new height of the screen.
   * @param resolution
   */ resize(desiredScreenWidth, desiredScreenHeight, resolution) {
        this.texture.source.resize(desiredScreenWidth, desiredScreenHeight, resolution);
        this.screen.width = this.texture.frame.width;
        this.screen.height = this.texture.frame.height;
    }
    /**
   * Destroys this System and optionally removes the canvas from the dom.
   * @param {options | false} options - The options for destroying the view, or "false".
   * @example
   * viewSystem.destroy();
   * viewSystem.destroy(true);
   * viewSystem.destroy({ removeView: true });
   */ destroy(options = false) {
        const removeView = typeof options === "boolean" ? options : !!options?.removeView;
        if (removeView && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.texture.destroy();
    }
};
/** @ignore */ _ViewSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "view",
    priority: 0
};
/** The default options for the view system. */ _ViewSystem.defaultOptions = {
    /**
   * {@link WebGLOptions.width}
   * @default 800
   */ width: 800,
    /**
   * {@link WebGLOptions.height}
   * @default 600
   */ height: 600,
    /**
   * {@link WebGLOptions.autoDensity}
   * @default false
   */ autoDensity: false,
    /**
   * {@link WebGLOptions.antialias}
   * @default false
   */ antialias: false
};
let ViewSystem = _ViewSystem;
;
 //# sourceMappingURL=ViewSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/SharedSystems.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SharedRenderPipes",
    ()=>SharedRenderPipes,
    "SharedSystems",
    ()=>SharedSystems
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$CustomRenderPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/CustomRenderPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroupPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroupPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroupSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroupSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$SpritePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/SpritePipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$global$2f$globalHooks$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/global/globalHooks.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$BatcherPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/BatcherPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$alpha$2f$AlphaMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/alpha/AlphaMaskPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$color$2f$ColorMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/color/ColorMaskPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$stencil$2f$StencilMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/stencil/StencilMaskPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$background$2f$BackgroundSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/background/BackgroundSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$blendModes$2f$BlendModePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/blendModes/BlendModePipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$extract$2f$ExtractSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/extract/ExtractSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$extract$2f$GenerateTextureSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/extract/GenerateTextureSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$GlobalUniformSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/GlobalUniformSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$SchedulerSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/SchedulerSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$startup$2f$HelloSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/startup/HelloSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$RenderableGCSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/RenderableGCSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureGCSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureGCSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$view$2f$ViewSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/view/ViewSystem.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
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
const SharedSystems = [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$background$2f$BackgroundSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BackgroundSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$GlobalUniformSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlobalUniformSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$startup$2f$HelloSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HelloSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$view$2f$ViewSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ViewSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroupSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderGroupSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureGCSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureGCSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$extract$2f$GenerateTextureSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GenerateTextureSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$extract$2f$ExtractSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtractSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$global$2f$globalHooks$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererInitHook"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$RenderableGCSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderableGCSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$SchedulerSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SchedulerSystem"]
];
const SharedRenderPipes = [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$blendModes$2f$BlendModePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BlendModePipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$BatcherPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatcherPipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$SpritePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SpritePipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroupPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderGroupPipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$alpha$2f$AlphaMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AlphaMaskPipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$stencil$2f$StencilMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StencilMaskPipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$color$2f$ColorMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ColorMaskPipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$CustomRenderPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CustomRenderPipe"]
];
;
 //# sourceMappingURL=SharedSystems.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/BindGroupSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BindGroupSystem",
    ()=>BindGroupSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class BindGroupSystem {
    constructor(renderer){
        this._hash = /* @__PURE__ */ Object.create(null);
        this._renderer = renderer;
        this._renderer.renderableGC.addManagedHash(this, "_hash");
    }
    contextChange(gpu) {
        this._gpu = gpu;
    }
    getBindGroup(bindGroup, program, groupIndex) {
        bindGroup._updateKey();
        const gpuBindGroup = this._hash[bindGroup._key] || this._createBindGroup(bindGroup, program, groupIndex);
        return gpuBindGroup;
    }
    _createBindGroup(group, program, groupIndex) {
        const device = this._gpu.device;
        const groupLayout = program.layout[groupIndex];
        const entries = [];
        const renderer = this._renderer;
        for(const j in groupLayout){
            const resource = group.resources[j] ?? group.resources[groupLayout[j]];
            let gpuResource;
            if (resource._resourceType === "uniformGroup") {
                const uniformGroup = resource;
                renderer.ubo.updateUniformGroup(uniformGroup);
                const buffer = uniformGroup.buffer;
                gpuResource = {
                    buffer: renderer.buffer.getGPUBuffer(buffer),
                    offset: 0,
                    size: buffer.descriptor.size
                };
            } else if (resource._resourceType === "buffer") {
                const buffer = resource;
                gpuResource = {
                    buffer: renderer.buffer.getGPUBuffer(buffer),
                    offset: 0,
                    size: buffer.descriptor.size
                };
            } else if (resource._resourceType === "bufferResource") {
                const bufferResource = resource;
                gpuResource = {
                    buffer: renderer.buffer.getGPUBuffer(bufferResource.buffer),
                    offset: bufferResource.offset,
                    size: bufferResource.size
                };
            } else if (resource._resourceType === "textureSampler") {
                const sampler = resource;
                gpuResource = renderer.texture.getGpuSampler(sampler);
            } else if (resource._resourceType === "textureSource") {
                const texture = resource;
                gpuResource = renderer.texture.getGpuSource(texture).createView({});
            }
            entries.push({
                binding: groupLayout[j],
                resource: gpuResource
            });
        }
        const layout = renderer.shader.getProgramData(program).bindGroups[groupIndex];
        const gpuBindGroup = device.createBindGroup({
            layout,
            entries
        });
        this._hash[group._key] = gpuBindGroup;
        return gpuBindGroup;
    }
    destroy() {
        for (const key of Object.keys(this._hash)){
            this._hash[key] = null;
        }
        this._hash = null;
        this._renderer = null;
    }
}
/** @ignore */ BindGroupSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "bindGroup"
};
;
 //# sourceMappingURL=BindGroupSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/GpuBufferSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuBufferSystem",
    ()=>GpuBufferSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$utils$2f$fastCopy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/utils/fastCopy.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class GpuBufferSystem {
    constructor(renderer){
        this._gpuBuffers = /* @__PURE__ */ Object.create(null);
        this._managedBuffers = [];
        renderer.renderableGC.addManagedHash(this, "_gpuBuffers");
    }
    contextChange(gpu) {
        this._gpu = gpu;
    }
    getGPUBuffer(buffer) {
        return this._gpuBuffers[buffer.uid] || this.createGPUBuffer(buffer);
    }
    updateBuffer(buffer) {
        const gpuBuffer = this._gpuBuffers[buffer.uid] || this.createGPUBuffer(buffer);
        const data = buffer.data;
        if (buffer._updateID && data) {
            buffer._updateID = 0;
            this._gpu.device.queue.writeBuffer(gpuBuffer, 0, data.buffer, 0, // round to the nearest 4 bytes
            (buffer._updateSize || data.byteLength) + 3 & ~3);
        }
        return gpuBuffer;
    }
    /** dispose all WebGL resources of all managed buffers */ destroyAll() {
        for(const id in this._gpuBuffers){
            this._gpuBuffers[id].destroy();
        }
        this._gpuBuffers = {};
    }
    createGPUBuffer(buffer) {
        if (!this._gpuBuffers[buffer.uid]) {
            buffer.on("update", this.updateBuffer, this);
            buffer.on("change", this.onBufferChange, this);
            buffer.on("destroy", this.onBufferDestroy, this);
            this._managedBuffers.push(buffer);
        }
        const gpuBuffer = this._gpu.device.createBuffer(buffer.descriptor);
        buffer._updateID = 0;
        if (buffer.data) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$utils$2f$fastCopy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fastCopy"])(buffer.data.buffer, gpuBuffer.getMappedRange());
            gpuBuffer.unmap();
        }
        this._gpuBuffers[buffer.uid] = gpuBuffer;
        return gpuBuffer;
    }
    onBufferChange(buffer) {
        const gpuBuffer = this._gpuBuffers[buffer.uid];
        gpuBuffer.destroy();
        buffer._updateID = 0;
        this._gpuBuffers[buffer.uid] = this.createGPUBuffer(buffer);
    }
    /**
   * Disposes buffer
   * @param buffer - buffer with data
   */ onBufferDestroy(buffer) {
        this._managedBuffers.splice(this._managedBuffers.indexOf(buffer), 1);
        this._destroyBuffer(buffer);
    }
    destroy() {
        this._managedBuffers.forEach((buffer)=>this._destroyBuffer(buffer));
        this._managedBuffers = null;
        this._gpuBuffers = null;
    }
    _destroyBuffer(buffer) {
        const gpuBuffer = this._gpuBuffers[buffer.uid];
        gpuBuffer.destroy();
        buffer.off("update", this.updateBuffer, this);
        buffer.off("change", this.onBufferChange, this);
        buffer.off("destroy", this.onBufferDestroy, this);
        this._gpuBuffers[buffer.uid] = null;
    }
}
/** @ignore */ GpuBufferSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "buffer"
};
;
 //# sourceMappingURL=GpuBufferSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuColorMaskSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuColorMaskSystem",
    ()=>GpuColorMaskSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class GpuColorMaskSystem {
    constructor(renderer){
        this._colorMaskCache = 15;
        this._renderer = renderer;
    }
    setMask(colorMask) {
        if (this._colorMaskCache === colorMask) return;
        this._colorMaskCache = colorMask;
        this._renderer.pipeline.setColorMask(colorMask);
    }
    destroy() {
        this._renderer = null;
        this._colorMaskCache = null;
    }
}
/** @ignore */ GpuColorMaskSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "colorMask"
};
;
 //# sourceMappingURL=GpuColorMaskSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuDeviceSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuDeviceSystem",
    ()=>GpuDeviceSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class GpuDeviceSystem {
    /**
   * @param {WebGPURenderer} renderer - The renderer this System works for.
   */ constructor(renderer){
        this._renderer = renderer;
    }
    async init(options) {
        if (this._initPromise) return this._initPromise;
        this._initPromise = (options.gpu ? Promise.resolve(options.gpu) : this._createDeviceAndAdaptor(options)).then((gpu)=>{
            this.gpu = gpu;
            this._renderer.runners.contextChange.emit(this.gpu);
        });
        return this._initPromise;
    }
    /**
   * Handle the context change event
   * @param gpu
   */ contextChange(gpu) {
        this._renderer.gpu = gpu;
    }
    /**
   * Helper class to create a WebGL Context
   * @param {object} options - An options object that gets passed in to the canvas element containing the
   *    context attributes
   * @see https://developer.mozilla.org/en/docs/Web/API/HTMLCanvasElement/getContext
   * @returns {WebGLRenderingContext} the WebGL context
   */ async _createDeviceAndAdaptor(options) {
        const adapter = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getNavigator().gpu.requestAdapter({
            powerPreference: options.powerPreference,
            forceFallbackAdapter: options.forceFallbackAdapter
        });
        const requiredFeatures = [
            "texture-compression-bc",
            "texture-compression-astc",
            "texture-compression-etc2"
        ].filter((feature)=>adapter.features.has(feature));
        const device = await adapter.requestDevice({
            requiredFeatures
        });
        return {
            adapter,
            device
        };
    }
    destroy() {
        this.gpu = null;
        this._renderer = null;
    }
}
/** @ignore */ GpuDeviceSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "device"
};
/** The default options for the GpuDeviceSystem. */ GpuDeviceSystem.defaultOptions = {
    /**
   * {@link WebGPUOptions.powerPreference}
   * @default default
   */ powerPreference: void 0,
    /**
   * Force the use of the fallback adapter
   * @default false
   */ forceFallbackAdapter: false
};
;
 //# sourceMappingURL=GpuDeviceSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuEncoderSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuEncoderSystem",
    ()=>GpuEncoderSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class GpuEncoderSystem {
    constructor(renderer){
        this._boundBindGroup = /* @__PURE__ */ Object.create(null);
        this._boundVertexBuffer = /* @__PURE__ */ Object.create(null);
        this._renderer = renderer;
    }
    renderStart() {
        this.commandFinished = new Promise((resolve)=>{
            this._resolveCommandFinished = resolve;
        });
        this.commandEncoder = this._renderer.gpu.device.createCommandEncoder();
    }
    beginRenderPass(gpuRenderTarget) {
        this.endRenderPass();
        this._clearCache();
        this.renderPassEncoder = this.commandEncoder.beginRenderPass(gpuRenderTarget.descriptor);
    }
    endRenderPass() {
        if (this.renderPassEncoder) {
            this.renderPassEncoder.end();
        }
        this.renderPassEncoder = null;
    }
    setViewport(viewport) {
        this.renderPassEncoder.setViewport(viewport.x, viewport.y, viewport.width, viewport.height, 0, 1);
    }
    setPipelineFromGeometryProgramAndState(geometry, program, state, topology) {
        const pipeline = this._renderer.pipeline.getPipeline(geometry, program, state, topology);
        this.setPipeline(pipeline);
    }
    setPipeline(pipeline) {
        if (this._boundPipeline === pipeline) return;
        this._boundPipeline = pipeline;
        this.renderPassEncoder.setPipeline(pipeline);
    }
    _setVertexBuffer(index, buffer) {
        if (this._boundVertexBuffer[index] === buffer) return;
        this._boundVertexBuffer[index] = buffer;
        this.renderPassEncoder.setVertexBuffer(index, this._renderer.buffer.updateBuffer(buffer));
    }
    _setIndexBuffer(buffer) {
        if (this._boundIndexBuffer === buffer) return;
        this._boundIndexBuffer = buffer;
        const indexFormat = buffer.data.BYTES_PER_ELEMENT === 2 ? "uint16" : "uint32";
        this.renderPassEncoder.setIndexBuffer(this._renderer.buffer.updateBuffer(buffer), indexFormat);
    }
    resetBindGroup(index) {
        this._boundBindGroup[index] = null;
    }
    setBindGroup(index, bindGroup, program) {
        if (this._boundBindGroup[index] === bindGroup) return;
        this._boundBindGroup[index] = bindGroup;
        bindGroup._touch(this._renderer.textureGC.count);
        const gpuBindGroup = this._renderer.bindGroup.getBindGroup(bindGroup, program, index);
        this.renderPassEncoder.setBindGroup(index, gpuBindGroup);
    }
    setGeometry(geometry, program) {
        const buffersToBind = this._renderer.pipeline.getBufferNamesToBind(geometry, program);
        for(const i in buffersToBind){
            this._setVertexBuffer(parseInt(i, 10), geometry.attributes[buffersToBind[i]].buffer);
        }
        if (geometry.indexBuffer) {
            this._setIndexBuffer(geometry.indexBuffer);
        }
    }
    _setShaderBindGroups(shader, skipSync) {
        for(const i in shader.groups){
            const bindGroup = shader.groups[i];
            if (!skipSync) {
                this._syncBindGroup(bindGroup);
            }
            this.setBindGroup(i, bindGroup, shader.gpuProgram);
        }
    }
    _syncBindGroup(bindGroup) {
        for(const j in bindGroup.resources){
            const resource = bindGroup.resources[j];
            if (resource.isUniformGroup) {
                this._renderer.ubo.updateUniformGroup(resource);
            }
        }
    }
    draw(options) {
        const { geometry, shader, state, topology, size, start, instanceCount, skipSync } = options;
        this.setPipelineFromGeometryProgramAndState(geometry, shader.gpuProgram, state, topology);
        this.setGeometry(geometry, shader.gpuProgram);
        this._setShaderBindGroups(shader, skipSync);
        if (geometry.indexBuffer) {
            this.renderPassEncoder.drawIndexed(size || geometry.indexBuffer.data.length, instanceCount ?? geometry.instanceCount, start || 0);
        } else {
            this.renderPassEncoder.draw(size || geometry.getSize(), instanceCount ?? geometry.instanceCount, start || 0);
        }
    }
    finishRenderPass() {
        if (this.renderPassEncoder) {
            this.renderPassEncoder.end();
            this.renderPassEncoder = null;
        }
    }
    postrender() {
        this.finishRenderPass();
        this._gpu.device.queue.submit([
            this.commandEncoder.finish()
        ]);
        this._resolveCommandFinished();
        this.commandEncoder = null;
    }
    // restores a render pass if finishRenderPass was called
    // not optimised as really used for debugging!
    // used when we want to stop drawing and log a texture..
    restoreRenderPass() {
        const descriptor = this._renderer.renderTarget.adaptor.getDescriptor(this._renderer.renderTarget.renderTarget, false, [
            0,
            0,
            0,
            1
        ]);
        this.renderPassEncoder = this.commandEncoder.beginRenderPass(descriptor);
        const boundPipeline = this._boundPipeline;
        const boundVertexBuffer = {
            ...this._boundVertexBuffer
        };
        const boundIndexBuffer = this._boundIndexBuffer;
        const boundBindGroup = {
            ...this._boundBindGroup
        };
        this._clearCache();
        const viewport = this._renderer.renderTarget.viewport;
        this.renderPassEncoder.setViewport(viewport.x, viewport.y, viewport.width, viewport.height, 0, 1);
        this.setPipeline(boundPipeline);
        for(const i in boundVertexBuffer){
            this._setVertexBuffer(i, boundVertexBuffer[i]);
        }
        for(const i in boundBindGroup){
            this.setBindGroup(i, boundBindGroup[i], null);
        }
        this._setIndexBuffer(boundIndexBuffer);
    }
    _clearCache() {
        for(let i = 0; i < 16; i++){
            this._boundBindGroup[i] = null;
            this._boundVertexBuffer[i] = null;
        }
        this._boundIndexBuffer = null;
        this._boundPipeline = null;
    }
    destroy() {
        this._renderer = null;
        this._gpu = null;
        this._boundBindGroup = null;
        this._boundVertexBuffer = null;
        this._boundIndexBuffer = null;
        this._boundPipeline = null;
    }
    contextChange(gpu) {
        this._gpu = gpu;
    }
}
/** @ignore */ GpuEncoderSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "encoder",
    priority: 1
};
;
 //# sourceMappingURL=GpuEncoderSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuLimitsSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuLimitsSystem",
    ()=>GpuLimitsSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class GpuLimitsSystem {
    constructor(renderer){
        this._renderer = renderer;
    }
    contextChange() {
        this.maxTextures = this._renderer.device.gpu.device.limits.maxSampledTexturesPerShaderStage;
        this.maxBatchableTextures = this.maxTextures;
    }
    destroy() {}
}
/** @ignore */ GpuLimitsSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "limits"
};
;
 //# sourceMappingURL=GpuLimitsSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuStencilSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuStencilSystem",
    ()=>GpuStencilSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/const.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class GpuStencilSystem {
    constructor(renderer){
        this._renderTargetStencilState = /* @__PURE__ */ Object.create(null);
        this._renderer = renderer;
        renderer.renderTarget.onRenderTargetChange.add(this);
    }
    onRenderTargetChange(renderTarget) {
        let stencilState = this._renderTargetStencilState[renderTarget.uid];
        if (!stencilState) {
            stencilState = this._renderTargetStencilState[renderTarget.uid] = {
                stencilMode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].DISABLED,
                stencilReference: 0
            };
        }
        this._activeRenderTarget = renderTarget;
        this.setStencilMode(stencilState.stencilMode, stencilState.stencilReference);
    }
    setStencilMode(stencilMode, stencilReference) {
        const stencilState = this._renderTargetStencilState[this._activeRenderTarget.uid];
        stencilState.stencilMode = stencilMode;
        stencilState.stencilReference = stencilReference;
        const renderer = this._renderer;
        renderer.pipeline.setStencilMode(stencilMode);
        renderer.encoder.renderPassEncoder.setStencilReference(stencilReference);
    }
    destroy() {
        this._renderer.renderTarget.onRenderTargetChange.remove(this);
        this._renderer = null;
        this._activeRenderTarget = null;
        this._renderTargetStencilState = null;
    }
}
/** @ignore */ GpuStencilSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "stencil"
};
;
 //# sourceMappingURL=GpuStencilSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UboSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UboSystem",
    ()=>UboSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$unsafeEvalSupported$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/unsafeEvalSupported.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/Buffer.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/const.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class UboSystem {
    constructor(adaptor){
        /** Cache of uniform buffer layouts and sync functions, so we don't have to re-create them */ this._syncFunctionHash = /* @__PURE__ */ Object.create(null);
        this._adaptor = adaptor;
        this._systemCheck();
    }
    /**
   * Overridable function by `pixi.js/unsafe-eval` to silence
   * throwing an error if platform doesn't support unsafe-evals.
   * @private
   */ _systemCheck() {
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$unsafeEvalSupported$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["unsafeEvalSupported"])()) {
            throw new Error("Current environment does not allow unsafe-eval, please use pixi.js/unsafe-eval module to enable support.");
        }
    }
    ensureUniformGroup(uniformGroup) {
        const uniformData = this.getUniformGroupData(uniformGroup);
        uniformGroup.buffer || (uniformGroup.buffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Buffer"]({
            data: new Float32Array(uniformData.layout.size / 4),
            usage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].UNIFORM | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST
        }));
    }
    getUniformGroupData(uniformGroup) {
        return this._syncFunctionHash[uniformGroup._signature] || this._initUniformGroup(uniformGroup);
    }
    _initUniformGroup(uniformGroup) {
        const uniformGroupSignature = uniformGroup._signature;
        let uniformData = this._syncFunctionHash[uniformGroupSignature];
        if (!uniformData) {
            const elements = Object.keys(uniformGroup.uniformStructures).map((i)=>uniformGroup.uniformStructures[i]);
            const layout = this._adaptor.createUboElements(elements);
            const syncFunction = this._generateUboSync(layout.uboElements);
            uniformData = this._syncFunctionHash[uniformGroupSignature] = {
                layout,
                syncFunction
            };
        }
        return this._syncFunctionHash[uniformGroupSignature];
    }
    _generateUboSync(uboElements) {
        return this._adaptor.generateUboSync(uboElements);
    }
    syncUniformGroup(uniformGroup, data, offset) {
        const uniformGroupData = this.getUniformGroupData(uniformGroup);
        uniformGroup.buffer || (uniformGroup.buffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Buffer"]({
            data: new Float32Array(uniformGroupData.layout.size / 4),
            usage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].UNIFORM | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST
        }));
        let dataInt32 = null;
        if (!data) {
            data = uniformGroup.buffer.data;
            dataInt32 = uniformGroup.buffer.dataInt32;
        }
        offset || (offset = 0);
        uniformGroupData.syncFunction(uniformGroup.uniforms, data, dataInt32, offset);
        return true;
    }
    updateUniformGroup(uniformGroup) {
        if (uniformGroup.isStatic && !uniformGroup._dirtyId) return false;
        uniformGroup._dirtyId = 0;
        const synced = this.syncUniformGroup(uniformGroup);
        uniformGroup.buffer.update();
        return synced;
    }
    destroy() {
        this._syncFunctionHash = null;
    }
}
;
 //# sourceMappingURL=UboSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboElementsWGSL.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WGSL_ALIGN_SIZE_DATA",
    ()=>WGSL_ALIGN_SIZE_DATA,
    "createUboElementsWGSL",
    ()=>createUboElementsWGSL
]);
"use strict";
const WGSL_ALIGN_SIZE_DATA = {
    i32: {
        align: 4,
        size: 4
    },
    u32: {
        align: 4,
        size: 4
    },
    f32: {
        align: 4,
        size: 4
    },
    f16: {
        align: 2,
        size: 2
    },
    "vec2<i32>": {
        align: 8,
        size: 8
    },
    "vec2<u32>": {
        align: 8,
        size: 8
    },
    "vec2<f32>": {
        align: 8,
        size: 8
    },
    "vec2<f16>": {
        align: 4,
        size: 4
    },
    "vec3<i32>": {
        align: 16,
        size: 12
    },
    "vec3<u32>": {
        align: 16,
        size: 12
    },
    "vec3<f32>": {
        align: 16,
        size: 12
    },
    "vec3<f16>": {
        align: 8,
        size: 6
    },
    "vec4<i32>": {
        align: 16,
        size: 16
    },
    "vec4<u32>": {
        align: 16,
        size: 16
    },
    "vec4<f32>": {
        align: 16,
        size: 16
    },
    "vec4<f16>": {
        align: 8,
        size: 8
    },
    "mat2x2<f32>": {
        align: 8,
        size: 16
    },
    "mat2x2<f16>": {
        align: 4,
        size: 8
    },
    "mat3x2<f32>": {
        align: 8,
        size: 24
    },
    "mat3x2<f16>": {
        align: 4,
        size: 12
    },
    "mat4x2<f32>": {
        align: 8,
        size: 32
    },
    "mat4x2<f16>": {
        align: 4,
        size: 16
    },
    "mat2x3<f32>": {
        align: 16,
        size: 32
    },
    "mat2x3<f16>": {
        align: 8,
        size: 16
    },
    "mat3x3<f32>": {
        align: 16,
        size: 48
    },
    "mat3x3<f16>": {
        align: 8,
        size: 24
    },
    "mat4x3<f32>": {
        align: 16,
        size: 64
    },
    "mat4x3<f16>": {
        align: 8,
        size: 32
    },
    "mat2x4<f32>": {
        align: 16,
        size: 32
    },
    "mat2x4<f16>": {
        align: 8,
        size: 16
    },
    "mat3x4<f32>": {
        align: 16,
        size: 48
    },
    "mat3x4<f16>": {
        align: 8,
        size: 24
    },
    "mat4x4<f32>": {
        align: 16,
        size: 64
    },
    "mat4x4<f16>": {
        align: 8,
        size: 32
    }
};
function createUboElementsWGSL(uniformData) {
    const uboElements = uniformData.map((data)=>({
            data,
            offset: 0,
            size: 0
        }));
    let offset = 0;
    for(let i = 0; i < uboElements.length; i++){
        const uboElement = uboElements[i];
        let size = WGSL_ALIGN_SIZE_DATA[uboElement.data.type].size;
        const align = WGSL_ALIGN_SIZE_DATA[uboElement.data.type].align;
        if (!WGSL_ALIGN_SIZE_DATA[uboElement.data.type]) {
            throw new Error(`[Pixi.js] WebGPU UniformBuffer: Unknown type ${uboElement.data.type}`);
        }
        if (uboElement.data.size > 1) {
            size = Math.max(size, align) * uboElement.data.size;
        }
        offset = Math.ceil(offset / align) * align;
        uboElement.size = size;
        uboElement.offset = offset;
        offset += size;
    }
    offset = Math.ceil(offset / 16) * 16;
    return {
        uboElements,
        size: offset
    };
}
;
 //# sourceMappingURL=createUboElementsWGSL.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/uniformParsers.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "uniformParsers",
    ()=>uniformParsers
]);
"use strict";
const uniformParsers = [
    // uploading pixi matrix object to mat3
    {
        type: "mat3x3<f32>",
        test: (data)=>{
            const value = data.value;
            return value.a !== void 0;
        },
        ubo: `
            var matrix = uv[name].toArray(true);
            data[offset] = matrix[0];
            data[offset + 1] = matrix[1];
            data[offset + 2] = matrix[2];
            data[offset + 4] = matrix[3];
            data[offset + 5] = matrix[4];
            data[offset + 6] = matrix[5];
            data[offset + 8] = matrix[6];
            data[offset + 9] = matrix[7];
            data[offset + 10] = matrix[8];
        `,
        uniform: `
            gl.uniformMatrix3fv(ud[name].location, false, uv[name].toArray(true));
        `
    },
    // uploading a pixi rectangle as a vec4
    {
        type: "vec4<f32>",
        test: (data)=>data.type === "vec4<f32>" && data.size === 1 && data.value.width !== void 0,
        ubo: `
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
            data[offset + 2] = v.width;
            data[offset + 3] = v.height;
        `,
        uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height) {
                cv[0] = v.x;
                cv[1] = v.y;
                cv[2] = v.width;
                cv[3] = v.height;
                gl.uniform4f(ud[name].location, v.x, v.y, v.width, v.height);
            }
        `
    },
    // uploading a pixi point as a vec2
    {
        type: "vec2<f32>",
        test: (data)=>data.type === "vec2<f32>" && data.size === 1 && data.value.x !== void 0,
        ubo: `
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
        `,
        uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y) {
                cv[0] = v.x;
                cv[1] = v.y;
                gl.uniform2f(ud[name].location, v.x, v.y);
            }
        `
    },
    // uploading a pixi color as a vec4
    {
        type: "vec4<f32>",
        test: (data)=>data.type === "vec4<f32>" && data.size === 1 && data.value.red !== void 0,
        ubo: `
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
            data[offset + 3] = v.alpha;
        `,
        uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.alpha) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                cv[3] = v.alpha;
                gl.uniform4f(ud[name].location, v.red, v.green, v.blue, v.alpha);
            }
        `
    },
    // uploading a pixi color as a vec3
    {
        type: "vec3<f32>",
        test: (data)=>data.type === "vec3<f32>" && data.size === 1 && data.value.red !== void 0,
        ubo: `
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
        `,
        uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                gl.uniform3f(ud[name].location, v.red, v.green, v.blue);
            }
        `
    }
];
;
 //# sourceMappingURL=uniformParsers.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/createUboSyncFunction.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createUboSyncFunction",
    ()=>createUboSyncFunction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/uniformParsers.mjs [app-ssr] (ecmascript)");
;
"use strict";
function createUboSyncFunction(uboElements, parserCode, arrayGenerationFunction, singleSettersMap) {
    const funcFragments = [
        `
        var v = null;
        var v2 = null;
        var t = 0;
        var index = 0;
        var name = null;
        var arrayOffset = null;
    `
    ];
    let prev = 0;
    for(let i = 0; i < uboElements.length; i++){
        const uboElement = uboElements[i];
        const name = uboElement.data.name;
        let parsed = false;
        let offset = 0;
        for(let j = 0; j < __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniformParsers"].length; j++){
            const uniformParser = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniformParsers"][j];
            if (uniformParser.test(uboElement.data)) {
                offset = uboElement.offset / 4;
                funcFragments.push(`name = "${name}";`, `offset += ${offset - prev};`, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniformParsers"][j][parserCode] || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniformParsers"][j].ubo);
                parsed = true;
                break;
            }
        }
        if (!parsed) {
            if (uboElement.data.size > 1) {
                offset = uboElement.offset / 4;
                funcFragments.push(arrayGenerationFunction(uboElement, offset - prev));
            } else {
                const template = singleSettersMap[uboElement.data.type];
                offset = uboElement.offset / 4;
                funcFragments.push(/* wgsl */ `
                    v = uv.${name};
                    offset += ${offset - prev};
                    ${template};
                `);
            }
        }
        prev = offset;
    }
    const fragmentSrc = funcFragments.join("\n");
    return new Function("uv", "data", "dataInt32", "offset", fragmentSrc);
}
;
 //# sourceMappingURL=createUboSyncFunction.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/uboSyncFunctions.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "uboSyncFunctionsSTD40",
    ()=>uboSyncFunctionsSTD40,
    "uboSyncFunctionsWGSL",
    ()=>uboSyncFunctionsWGSL
]);
"use strict";
function loopMatrix(col, row) {
    const total = col * row;
    return `
        for (let i = 0; i < ${total}; i++) {
            data[offset + (((i / ${col})|0) * 4) + (i % ${col})] = v[i];
        }
    `;
}
const uboSyncFunctionsSTD40 = {
    f32: `
        data[offset] = v;`,
    i32: `
        dataInt32[offset] = v;`,
    "vec2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];`,
    "vec3<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];`,
    "vec4<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];`,
    "vec2<i32>": `
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];`,
    "vec3<i32>": `
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];
        dataInt32[offset + 2] = v[2];`,
    "vec4<i32>": `
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];
        dataInt32[offset + 2] = v[2];
        dataInt32[offset + 3] = v[3];`,
    "mat2x2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 4] = v[2];
        data[offset + 5] = v[3];`,
    "mat3x3<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 4] = v[3];
        data[offset + 5] = v[4];
        data[offset + 6] = v[5];
        data[offset + 8] = v[6];
        data[offset + 9] = v[7];
        data[offset + 10] = v[8];`,
    "mat4x4<f32>": `
        for (let i = 0; i < 16; i++) {
            data[offset + i] = v[i];
        }`,
    "mat3x2<f32>": loopMatrix(3, 2),
    "mat4x2<f32>": loopMatrix(4, 2),
    "mat2x3<f32>": loopMatrix(2, 3),
    "mat4x3<f32>": loopMatrix(4, 3),
    "mat2x4<f32>": loopMatrix(2, 4),
    "mat3x4<f32>": loopMatrix(3, 4)
};
const uboSyncFunctionsWGSL = {
    ...uboSyncFunctionsSTD40,
    "mat2x2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];
    `
};
;
 //# sourceMappingURL=uboSyncFunctions.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/generateArraySyncWGSL.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateArraySyncWGSL",
    ()=>generateArraySyncWGSL
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$createUboElementsWGSL$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboElementsWGSL.mjs [app-ssr] (ecmascript)");
;
"use strict";
function generateArraySyncWGSL(uboElement, offsetToAdd) {
    const { size, align } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$createUboElementsWGSL$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WGSL_ALIGN_SIZE_DATA"][uboElement.data.type];
    const remainder = (align - size) / 4;
    const data = uboElement.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
    return `
         v = uv.${uboElement.data.name};
         ${offsetToAdd !== 0 ? `offset += ${offsetToAdd};` : ""}

         arrayOffset = offset;

         t = 0;

         for(var i=0; i < ${uboElement.data.size * (size / 4)}; i++)
         {
             for(var j = 0; j < ${size / 4}; j++)
             {
                 ${data}[arrayOffset++] = v[t++];
             }
             ${remainder !== 0 ? `arrayOffset += ${remainder};` : ""}
         }
     `;
}
;
 //# sourceMappingURL=generateArraySyncWGSL.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboSyncFunctionWGSL.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createUboSyncFunctionWGSL",
    ()=>createUboSyncFunctionWGSL
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$createUboSyncFunction$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/createUboSyncFunction.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uboSyncFunctions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/uboSyncFunctions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$generateArraySyncWGSL$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/generateArraySyncWGSL.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
function createUboSyncFunctionWGSL(uboElements) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$createUboSyncFunction$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createUboSyncFunction"])(uboElements, "uboWgsl", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$generateArraySyncWGSL$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateArraySyncWGSL"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uboSyncFunctions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uboSyncFunctionsWGSL"]);
}
;
 //# sourceMappingURL=createUboSyncFunctionWGSL.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuUboSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuUboSystem",
    ()=>GpuUboSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UboSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UboSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$createUboElementsWGSL$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboElementsWGSL.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$createUboSyncFunctionWGSL$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboSyncFunctionWGSL.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
class GpuUboSystem extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UboSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UboSystem"] {
    constructor(){
        super({
            createUboElements: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$createUboElementsWGSL$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createUboElementsWGSL"],
            generateUboSync: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$utils$2f$createUboSyncFunctionWGSL$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createUboSyncFunctionWGSL"]
        });
    }
}
/** @ignore */ GpuUboSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "ubo"
};
;
 //# sourceMappingURL=GpuUboSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/BufferResource.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BufferResource",
    ()=>BufferResource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class BufferResource extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    /**
   * Create a new Buffer Resource.
   * @param options - The options for the buffer resource
   * @param options.buffer - The underlying buffer that this resource is using
   * @param options.offset - The offset of the buffer this resource is using.
   * If not provided, then it will use the offset of the buffer.
   * @param options.size - The size of the buffer this resource is using.
   * If not provided, then it will use the size of the buffer.
   */ constructor({ buffer, offset, size }){
        super();
        /**
     * emits when the underlying buffer has changed shape (i.e. resized)
     * letting the renderer know that it needs to discard the old buffer on the GPU and create a new one
     * @event change
     */ /** a unique id for this uniform group used through the renderer */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uid"])("buffer");
        /**
     * a resource type, used to identify how to handle it when its in a bind group / shader resource
     * @internal
     */ this._resourceType = "bufferResource";
        /**
     * used internally to know if a uniform group was used in the last render pass
     * @internal
     */ this._touched = 0;
        /**
     * the resource id used internally by the renderer to build bind group keys
     * @internal
     */ this._resourceId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uid"])("resource");
        /**
     * A cheeky hint to the GL renderer to let it know this is a BufferResource
     * @internal
     */ this._bufferResource = true;
        /**
     * Has the Buffer resource been destroyed?
     * @readonly
     */ this.destroyed = false;
        this.buffer = buffer;
        this.offset = offset | 0;
        this.size = size;
        this.buffer.on("change", this.onBufferChange, this);
    }
    onBufferChange() {
        this._resourceId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uid"])("resource");
        this.emit("change", this);
    }
    /**
   * Destroys this resource. Make sure the underlying buffer is not used anywhere else
   * if you want to destroy it as well, or code will explode
   * @param destroyBuffer - Should the underlying buffer be destroyed as well?
   */ destroy(destroyBuffer = false) {
        this.destroyed = true;
        if (destroyBuffer) {
            this.buffer.destroy();
        }
        this.emit("change", this);
        this.buffer = null;
    }
}
;
 //# sourceMappingURL=BufferResource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/UboBatch.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UboBatch",
    ()=>UboBatch
]);
"use strict";
class UboBatch {
    constructor({ minUniformOffsetAlignment }){
        this._minUniformOffsetAlignment = 256;
        this.byteIndex = 0;
        this._minUniformOffsetAlignment = minUniformOffsetAlignment;
        this.data = new Float32Array(65535);
    }
    clear() {
        this.byteIndex = 0;
    }
    addEmptyGroup(size) {
        if (size > this._minUniformOffsetAlignment / 4) {
            throw new Error(`UniformBufferBatch: array is too large: ${size * 4}`);
        }
        const start = this.byteIndex;
        let newSize = start + size * 4;
        newSize = Math.ceil(newSize / this._minUniformOffsetAlignment) * this._minUniformOffsetAlignment;
        if (newSize > this.data.length * 4) {
            throw new Error("UniformBufferBatch: ubo batch got too big");
        }
        this.byteIndex = newSize;
        return start;
    }
    addGroup(array) {
        const offset = this.addEmptyGroup(array.length);
        for(let i = 0; i < array.length; i++){
            this.data[offset / 4 + i] = array[i];
        }
        return offset;
    }
    destroy() {
        this.data = null;
    }
}
;
 //# sourceMappingURL=UboBatch.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuUniformBatchPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuUniformBatchPipe",
    ()=>GpuUniformBatchPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/Buffer.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$BufferResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/BufferResource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$buffer$2f$UboBatch$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/UboBatch.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/BindGroup.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
"use strict";
const minUniformOffsetAlignment = 128;
class GpuUniformBatchPipe {
    constructor(renderer){
        this._bindGroupHash = /* @__PURE__ */ Object.create(null);
        // number of buffers..
        this._buffers = [];
        this._bindGroups = [];
        this._bufferResources = [];
        this._renderer = renderer;
        this._renderer.renderableGC.addManagedHash(this, "_bindGroupHash");
        this._batchBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$buffer$2f$UboBatch$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UboBatch"]({
            minUniformOffsetAlignment
        });
        const totalBuffers = 256 / minUniformOffsetAlignment;
        for(let i = 0; i < totalBuffers; i++){
            let usage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].UNIFORM | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST;
            if (i === 0) usage |= __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_SRC;
            this._buffers.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Buffer"]({
                data: this._batchBuffer.data,
                usage
            }));
        }
    }
    renderEnd() {
        this._uploadBindGroups();
        this._resetBindGroups();
    }
    _resetBindGroups() {
        for(const i in this._bindGroupHash){
            this._bindGroupHash[i] = null;
        }
        this._batchBuffer.clear();
    }
    // just works for single bind groups for now
    getUniformBindGroup(group, duplicate) {
        if (!duplicate && this._bindGroupHash[group.uid]) {
            return this._bindGroupHash[group.uid];
        }
        this._renderer.ubo.ensureUniformGroup(group);
        const data = group.buffer.data;
        const offset = this._batchBuffer.addEmptyGroup(data.length);
        this._renderer.ubo.syncUniformGroup(group, this._batchBuffer.data, offset / 4);
        this._bindGroupHash[group.uid] = this._getBindGroup(offset / minUniformOffsetAlignment);
        return this._bindGroupHash[group.uid];
    }
    getUboResource(group) {
        this._renderer.ubo.updateUniformGroup(group);
        const data = group.buffer.data;
        const offset = this._batchBuffer.addGroup(data);
        return this._getBufferResource(offset / minUniformOffsetAlignment);
    }
    getArrayBindGroup(data) {
        const offset = this._batchBuffer.addGroup(data);
        return this._getBindGroup(offset / minUniformOffsetAlignment);
    }
    getArrayBufferResource(data) {
        const offset = this._batchBuffer.addGroup(data);
        const index = offset / minUniformOffsetAlignment;
        return this._getBufferResource(index);
    }
    _getBufferResource(index) {
        if (!this._bufferResources[index]) {
            const buffer = this._buffers[index % 2];
            this._bufferResources[index] = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$BufferResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferResource"]({
                buffer,
                offset: (index / 2 | 0) * 256,
                size: minUniformOffsetAlignment
            });
        }
        return this._bufferResources[index];
    }
    _getBindGroup(index) {
        if (!this._bindGroups[index]) {
            const bindGroup = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BindGroup"]({
                0: this._getBufferResource(index)
            });
            this._bindGroups[index] = bindGroup;
        }
        return this._bindGroups[index];
    }
    _uploadBindGroups() {
        const bufferSystem = this._renderer.buffer;
        const firstBuffer = this._buffers[0];
        firstBuffer.update(this._batchBuffer.byteIndex);
        bufferSystem.updateBuffer(firstBuffer);
        const commandEncoder = this._renderer.gpu.device.createCommandEncoder();
        for(let i = 1; i < this._buffers.length; i++){
            const buffer = this._buffers[i];
            commandEncoder.copyBufferToBuffer(bufferSystem.getGPUBuffer(firstBuffer), minUniformOffsetAlignment, bufferSystem.getGPUBuffer(buffer), 0, this._batchBuffer.byteIndex);
        }
        this._renderer.gpu.device.queue.submit([
            commandEncoder.finish()
        ]);
    }
    destroy() {
        for(let i = 0; i < this._bindGroups.length; i++){
            this._bindGroups[i]?.destroy();
        }
        this._bindGroups = null;
        this._bindGroupHash = null;
        for(let i = 0; i < this._buffers.length; i++){
            this._buffers[i].destroy();
        }
        this._buffers = null;
        for(let i = 0; i < this._bufferResources.length; i++){
            this._bufferResources[i].destroy();
        }
        this._bufferResources = null;
        this._batchBuffer.destroy();
        this._bindGroupHash = null;
        this._renderer = null;
    }
}
/** @ignore */ GpuUniformBatchPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes
    ],
    name: "uniformBatch"
};
;
 //# sourceMappingURL=GpuUniformBatchPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/ensureAttributes.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ensureAttributes",
    ()=>ensureAttributes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/getAttributeInfoFromFormat.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
function ensureAttributes(geometry, extractedData) {
    for(const i in geometry.attributes){
        const attribute = geometry.attributes[i];
        const attributeData = extractedData[i];
        if (attributeData) {
            attribute.format ?? (attribute.format = attributeData.format);
            attribute.offset ?? (attribute.offset = attributeData.offset);
            attribute.instance ?? (attribute.instance = attributeData.instance);
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`Attribute ${i} is not present in the shader, but is present in the geometry. Unable to infer attribute details.`);
        }
    }
    ensureStartAndStride(geometry);
}
function ensureStartAndStride(geometry) {
    const { buffers, attributes } = geometry;
    const tempStride = {};
    const tempStart = {};
    for(const j in buffers){
        const buffer = buffers[j];
        tempStride[buffer.uid] = 0;
        tempStart[buffer.uid] = 0;
    }
    for(const j in attributes){
        const attribute = attributes[j];
        tempStride[attribute.buffer.uid] += (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAttributeInfoFromFormat"])(attribute.format).stride;
    }
    for(const j in attributes){
        const attribute = attributes[j];
        attribute.stride ?? (attribute.stride = tempStride[attribute.buffer.uid]);
        attribute.start ?? (attribute.start = tempStart[attribute.buffer.uid]);
        tempStart[attribute.buffer.uid] += (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAttributeInfoFromFormat"])(attribute.format).stride;
    }
}
;
 //# sourceMappingURL=ensureAttributes.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuStencilModesToPixi.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuStencilModesToPixi",
    ()=>GpuStencilModesToPixi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/const.mjs [app-ssr] (ecmascript)");
;
"use strict";
const GpuStencilModesToPixi = [];
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].NONE] = void 0;
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].DISABLED] = {
    stencilWriteMask: 0,
    stencilReadMask: 0
};
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].RENDERING_MASK_ADD] = {
    stencilFront: {
        compare: "equal",
        passOp: "increment-clamp"
    },
    stencilBack: {
        compare: "equal",
        passOp: "increment-clamp"
    }
};
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].RENDERING_MASK_REMOVE] = {
    stencilFront: {
        compare: "equal",
        passOp: "decrement-clamp"
    },
    stencilBack: {
        compare: "equal",
        passOp: "decrement-clamp"
    }
};
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].MASK_ACTIVE] = {
    stencilWriteMask: 0,
    stencilFront: {
        compare: "equal",
        passOp: "keep"
    },
    stencilBack: {
        compare: "equal",
        passOp: "keep"
    }
};
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].INVERSE_MASK_ACTIVE] = {
    stencilWriteMask: 0,
    stencilFront: {
        compare: "not-equal",
        passOp: "keep"
    },
    stencilBack: {
        compare: "not-equal",
        passOp: "keep"
    }
};
;
 //# sourceMappingURL=GpuStencilModesToPixi.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/pipeline/PipelineSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PipelineSystem",
    ()=>PipelineSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$ensureAttributes$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/ensureAttributes.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$utils$2f$createIdFromString$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/utils/createIdFromString.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$state$2f$GpuStencilModesToPixi$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuStencilModesToPixi.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
"use strict";
const topologyStringToId = {
    "point-list": 0,
    "line-list": 1,
    "line-strip": 2,
    "triangle-list": 3,
    "triangle-strip": 4
};
function getGraphicsStateKey(geometryLayout, shaderKey, state, blendMode, topology) {
    return geometryLayout << 24 | shaderKey << 16 | state << 10 | blendMode << 5 | topology;
}
function getGlobalStateKey(stencilStateId, multiSampleCount, colorMask, renderTarget) {
    return colorMask << 6 | stencilStateId << 3 | renderTarget << 1 | multiSampleCount;
}
class PipelineSystem {
    constructor(renderer){
        this._moduleCache = /* @__PURE__ */ Object.create(null);
        this._bufferLayoutsCache = /* @__PURE__ */ Object.create(null);
        this._bindingNamesCache = /* @__PURE__ */ Object.create(null);
        this._pipeCache = /* @__PURE__ */ Object.create(null);
        this._pipeStateCaches = /* @__PURE__ */ Object.create(null);
        this._colorMask = 15;
        this._multisampleCount = 1;
        this._renderer = renderer;
    }
    contextChange(gpu) {
        this._gpu = gpu;
        this.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].DISABLED);
        this._updatePipeHash();
    }
    setMultisampleCount(multisampleCount) {
        if (this._multisampleCount === multisampleCount) return;
        this._multisampleCount = multisampleCount;
        this._updatePipeHash();
    }
    setRenderTarget(renderTarget) {
        this._multisampleCount = renderTarget.msaaSamples;
        this._depthStencilAttachment = renderTarget.descriptor.depthStencilAttachment ? 1 : 0;
        this._updatePipeHash();
    }
    setColorMask(colorMask) {
        if (this._colorMask === colorMask) return;
        this._colorMask = colorMask;
        this._updatePipeHash();
    }
    setStencilMode(stencilMode) {
        if (this._stencilMode === stencilMode) return;
        this._stencilMode = stencilMode;
        this._stencilState = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$state$2f$GpuStencilModesToPixi$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuStencilModesToPixi"][stencilMode];
        this._updatePipeHash();
    }
    setPipeline(geometry, program, state, passEncoder) {
        const pipeline = this.getPipeline(geometry, program, state);
        passEncoder.setPipeline(pipeline);
    }
    getPipeline(geometry, program, state, topology) {
        if (!geometry._layoutKey) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$ensureAttributes$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ensureAttributes"])(geometry, program.attributeData);
            this._generateBufferKey(geometry);
        }
        topology || (topology = geometry.topology);
        const key = getGraphicsStateKey(geometry._layoutKey, program._layoutKey, state.data, state._blendModeId, topologyStringToId[topology]);
        if (this._pipeCache[key]) return this._pipeCache[key];
        this._pipeCache[key] = this._createPipeline(geometry, program, state, topology);
        return this._pipeCache[key];
    }
    _createPipeline(geometry, program, state, topology) {
        const device = this._gpu.device;
        const buffers = this._createVertexBufferLayouts(geometry, program);
        const blendModes = this._renderer.state.getColorTargets(state);
        blendModes[0].writeMask = this._stencilMode === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].RENDERING_MASK_ADD ? 0 : this._colorMask;
        const layout = this._renderer.shader.getProgramData(program).pipeline;
        const descriptor = {
            // TODO later check if its helpful to create..
            // layout,
            vertex: {
                module: this._getModule(program.vertex.source),
                entryPoint: program.vertex.entryPoint,
                // geometry..
                buffers
            },
            fragment: {
                module: this._getModule(program.fragment.source),
                entryPoint: program.fragment.entryPoint,
                targets: blendModes
            },
            primitive: {
                topology,
                cullMode: state.cullMode
            },
            layout,
            multisample: {
                count: this._multisampleCount
            },
            // depthStencil,
            label: `PIXI Pipeline`
        };
        if (this._depthStencilAttachment) {
            descriptor.depthStencil = {
                ...this._stencilState,
                format: "depth24plus-stencil8",
                depthWriteEnabled: state.depthTest,
                depthCompare: state.depthTest ? "less" : "always"
            };
        }
        const pipeline = device.createRenderPipeline(descriptor);
        return pipeline;
    }
    _getModule(code) {
        return this._moduleCache[code] || this._createModule(code);
    }
    _createModule(code) {
        const device = this._gpu.device;
        this._moduleCache[code] = device.createShaderModule({
            code
        });
        return this._moduleCache[code];
    }
    _generateBufferKey(geometry) {
        const keyGen = [];
        let index = 0;
        const attributeKeys = Object.keys(geometry.attributes).sort();
        for(let i = 0; i < attributeKeys.length; i++){
            const attribute = geometry.attributes[attributeKeys[i]];
            keyGen[index++] = attribute.offset;
            keyGen[index++] = attribute.format;
            keyGen[index++] = attribute.stride;
            keyGen[index++] = attribute.instance;
        }
        const stringKey = keyGen.join("|");
        geometry._layoutKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$utils$2f$createIdFromString$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createIdFromString"])(stringKey, "geometry");
        return geometry._layoutKey;
    }
    _generateAttributeLocationsKey(program) {
        const keyGen = [];
        let index = 0;
        const attributeKeys = Object.keys(program.attributeData).sort();
        for(let i = 0; i < attributeKeys.length; i++){
            const attribute = program.attributeData[attributeKeys[i]];
            keyGen[index++] = attribute.location;
        }
        const stringKey = keyGen.join("|");
        program._attributeLocationsKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$utils$2f$createIdFromString$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createIdFromString"])(stringKey, "programAttributes");
        return program._attributeLocationsKey;
    }
    /**
   * Returns a hash of buffer names mapped to bind locations.
   * This is used to bind the correct buffer to the correct location in the shader.
   * @param geometry - The geometry where to get the buffer names
   * @param program - The program where to get the buffer names
   * @returns An object of buffer names mapped to the bind location.
   */ getBufferNamesToBind(geometry, program) {
        const key = geometry._layoutKey << 16 | program._attributeLocationsKey;
        if (this._bindingNamesCache[key]) return this._bindingNamesCache[key];
        const data = this._createVertexBufferLayouts(geometry, program);
        const bufferNamesToBind = /* @__PURE__ */ Object.create(null);
        const attributeData = program.attributeData;
        for(let i = 0; i < data.length; i++){
            const attributes = Object.values(data[i].attributes);
            const shaderLocation = attributes[0].shaderLocation;
            for(const j in attributeData){
                if (attributeData[j].location === shaderLocation) {
                    bufferNamesToBind[i] = j;
                    break;
                }
            }
        }
        this._bindingNamesCache[key] = bufferNamesToBind;
        return bufferNamesToBind;
    }
    _createVertexBufferLayouts(geometry, program) {
        if (!program._attributeLocationsKey) this._generateAttributeLocationsKey(program);
        const key = geometry._layoutKey << 16 | program._attributeLocationsKey;
        if (this._bufferLayoutsCache[key]) {
            return this._bufferLayoutsCache[key];
        }
        const vertexBuffersLayout = [];
        geometry.buffers.forEach((buffer)=>{
            const bufferEntry = {
                arrayStride: 0,
                stepMode: "vertex",
                attributes: []
            };
            const bufferEntryAttributes = bufferEntry.attributes;
            for(const i in program.attributeData){
                const attribute = geometry.attributes[i];
                if ((attribute.divisor ?? 1) !== 1) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`Attribute ${i} has an invalid divisor value of '${attribute.divisor}'. WebGPU only supports a divisor value of 1`);
                }
                if (attribute.buffer === buffer) {
                    bufferEntry.arrayStride = attribute.stride;
                    bufferEntry.stepMode = attribute.instance ? "instance" : "vertex";
                    bufferEntryAttributes.push({
                        shaderLocation: program.attributeData[i].location,
                        offset: attribute.offset,
                        format: attribute.format
                    });
                }
            }
            if (bufferEntryAttributes.length) {
                vertexBuffersLayout.push(bufferEntry);
            }
        });
        this._bufferLayoutsCache[key] = vertexBuffersLayout;
        return vertexBuffersLayout;
    }
    _updatePipeHash() {
        const key = getGlobalStateKey(this._stencilMode, this._multisampleCount, this._colorMask, this._depthStencilAttachment);
        if (!this._pipeStateCaches[key]) {
            this._pipeStateCaches[key] = /* @__PURE__ */ Object.create(null);
        }
        this._pipeCache = this._pipeStateCaches[key];
    }
    destroy() {
        this._renderer = null;
        this._bufferLayoutsCache = null;
    }
}
/** @ignore */ PipelineSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "pipeline"
};
;
 //# sourceMappingURL=PipelineSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/calculateProjection.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateProjection",
    ()=>calculateProjection
]);
"use strict";
function calculateProjection(pm, x, y, width, height, flipY) {
    const sign = flipY ? 1 : -1;
    pm.identity();
    pm.a = 1 / width * 2;
    pm.d = sign * (1 / height * 2);
    pm.tx = -1 - x * pm.a;
    pm.ty = -sign - y * pm.d;
    return pm;
}
;
 //# sourceMappingURL=calculateProjection.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/isRenderingToScreen.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isRenderingToScreen",
    ()=>isRenderingToScreen
]);
"use strict";
function isRenderingToScreen(renderTarget) {
    const resource = renderTarget.colorTexture.source.resource;
    return globalThis.HTMLCanvasElement && resource instanceof HTMLCanvasElement && document.body.contains(resource);
}
;
 //# sourceMappingURL=isRenderingToScreen.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/RenderTargetSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderTargetSystem",
    ()=>RenderTargetSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$renderTarget$2f$calculateProjection$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/calculateProjection.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SystemRunner$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/SystemRunner.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/CanvasSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$utils$2f$getCanvasTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/getCanvasTexture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$isRenderingToScreen$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/isRenderingToScreen.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/RenderTarget.mjs [app-ssr] (ecmascript)");
;
;
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
class RenderTargetSystem {
    constructor(renderer){
        /** This is the root viewport for the render pass*/ this.rootViewPort = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"]();
        /** the current viewport that the gpu is using */ this.viewport = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"]();
        /**
     * a runner that lets systems know if the active render target has changed.
     * Eg the Stencil System needs to know so it can manage the stencil buffer
     */ this.onRenderTargetChange = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SystemRunner$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SystemRunner"]("onRenderTargetChange");
        /** the projection matrix that is used by the shaders based on the active render target and the viewport */ this.projectionMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"]();
        /** the default clear color for render targets */ this.defaultClearColor = [
            0,
            0,
            0,
            0
        ];
        /**
     * a hash that stores the render target for a given render surface. When you pass in a texture source,
     * a render target is created for it. This map stores and makes it easy to retrieve the render target
     */ this._renderSurfaceToRenderTargetHash = /* @__PURE__ */ new Map();
        /** A hash that stores a gpu render target for a given render target. */ this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null);
        /**
     * A stack that stores the render target and frame that is currently being rendered to.
     * When push is called, the current render target is stored in this stack.
     * When pop is called, the previous render target is restored.
     */ this._renderTargetStack = [];
        this._renderer = renderer;
        renderer.renderableGC.addManagedHash(this, "_gpuRenderTargetHash");
    }
    /** called when dev wants to finish a render pass */ finishRenderPass() {
        this.adaptor.finishRenderPass(this.renderTarget);
    }
    /**
   * called when the renderer starts to render a scene.
   * @param options
   * @param options.target - the render target to render to
   * @param options.clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param options.clearColor - the color to clear to
   * @param options.frame - the frame to render to
   */ renderStart({ target, clear, clearColor, frame }) {
        this._renderTargetStack.length = 0;
        this.push(target, clear, clearColor, frame);
        this.rootViewPort.copyFrom(this.viewport);
        this.rootRenderTarget = this.renderTarget;
        this.renderingToScreen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$isRenderingToScreen$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isRenderingToScreen"])(this.rootRenderTarget);
        this.adaptor.prerender?.(this.rootRenderTarget);
    }
    postrender() {
        this.adaptor.postrender?.(this.rootRenderTarget);
    }
    /**
   * Binding a render surface! This is the main function of the render target system.
   * It will take the RenderSurface (which can be a texture, canvas, or render target) and bind it to the renderer.
   * Once bound all draw calls will be rendered to the render surface.
   *
   * If a frame is not provide and the render surface is a texture, the frame of the texture will be used.
   * @param renderSurface - the render surface to bind
   * @param clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param clearColor - the color to clear to
   * @param frame - the frame to render to
   * @returns the render target that was bound
   */ bind(renderSurface, clear = true, clearColor, frame) {
        const renderTarget = this.getRenderTarget(renderSurface);
        const didChange = this.renderTarget !== renderTarget;
        this.renderTarget = renderTarget;
        this.renderSurface = renderSurface;
        const gpuRenderTarget = this.getGpuRenderTarget(renderTarget);
        if (renderTarget.pixelWidth !== gpuRenderTarget.width || renderTarget.pixelHeight !== gpuRenderTarget.height) {
            this.adaptor.resizeGpuRenderTarget(renderTarget);
            gpuRenderTarget.width = renderTarget.pixelWidth;
            gpuRenderTarget.height = renderTarget.pixelHeight;
        }
        const source = renderTarget.colorTexture;
        const viewport = this.viewport;
        const pixelWidth = source.pixelWidth;
        const pixelHeight = source.pixelHeight;
        if (!frame && renderSurface instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]) {
            frame = renderSurface.frame;
        }
        if (frame) {
            const resolution = source._resolution;
            viewport.x = frame.x * resolution + 0.5 | 0;
            viewport.y = frame.y * resolution + 0.5 | 0;
            viewport.width = frame.width * resolution + 0.5 | 0;
            viewport.height = frame.height * resolution + 0.5 | 0;
        } else {
            viewport.x = 0;
            viewport.y = 0;
            viewport.width = pixelWidth;
            viewport.height = pixelHeight;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$renderTarget$2f$calculateProjection$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateProjection"])(this.projectionMatrix, 0, 0, viewport.width / source.resolution, viewport.height / source.resolution, !renderTarget.isRoot);
        this.adaptor.startRenderPass(renderTarget, clear, clearColor, viewport);
        if (didChange) {
            this.onRenderTargetChange.emit(renderTarget);
        }
        return renderTarget;
    }
    clear(target, clear = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].ALL, clearColor) {
        if (!clear) return;
        if (target) {
            target = this.getRenderTarget(target);
        }
        this.adaptor.clear(target || this.renderTarget, clear, clearColor, this.viewport);
    }
    contextChange() {
        this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null);
    }
    /**
   * Push a render surface to the renderer. This will bind the render surface to the renderer,
   * @param renderSurface - the render surface to push
   * @param clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param clearColor - the color to clear to
   * @param frame - the frame to use when rendering to the render surface
   */ push(renderSurface, clear = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].ALL, clearColor, frame) {
        const renderTarget = this.bind(renderSurface, clear, clearColor, frame);
        this._renderTargetStack.push({
            renderTarget,
            frame
        });
        return renderTarget;
    }
    /** Pops the current render target from the renderer and restores the previous render target. */ pop() {
        this._renderTargetStack.pop();
        const currentRenderTargetData = this._renderTargetStack[this._renderTargetStack.length - 1];
        this.bind(currentRenderTargetData.renderTarget, false, null, currentRenderTargetData.frame);
    }
    /**
   * Gets the render target from the provide render surface. Eg if its a texture,
   * it will return the render target for the texture.
   * If its a render target, it will return the same render target.
   * @param renderSurface - the render surface to get the render target for
   * @returns the render target for the render surface
   */ getRenderTarget(renderSurface) {
        if (renderSurface.isTexture) {
            renderSurface = renderSurface.source;
        }
        return this._renderSurfaceToRenderTargetHash.get(renderSurface) ?? this._initRenderTarget(renderSurface);
    }
    /**
   * Copies a render surface to another texture.
   *
   * NOTE:
   * for sourceRenderSurfaceTexture, The render target must be something that is written too by the renderer
   *
   * The following is not valid:
   * @example
   * const canvas = document.createElement('canvas')
   * canvas.width = 200;
   * canvas.height = 200;
   *
   * const ctx = canvas2.getContext('2d')!
   * ctx.fillStyle = 'red'
   * ctx.fillRect(0, 0, 200, 200);
   *
   * const texture = RenderTexture.create({
   *   width: 200,
   *   height: 200,
   * })
   * const renderTarget = renderer.renderTarget.getRenderTarget(canvas2);
   *
   * renderer.renderTarget.copyToTexture(renderTarget,texture, {x:0,y:0},{width:200,height:200},{x:0,y:0});
   *
   * The best way to copy a canvas is to create a texture from it. Then render with that.
   *
   * Parsing in a RenderTarget canvas context (with a 2d context)
   * @param sourceRenderSurfaceTexture - the render surface to copy from
   * @param destinationTexture - the texture to copy to
   * @param originSrc - the origin of the copy
   * @param originSrc.x - the x origin of the copy
   * @param originSrc.y - the y origin of the copy
   * @param size - the size of the copy
   * @param size.width - the width of the copy
   * @param size.height - the height of the copy
   * @param originDest - the destination origin (top left to paste from!)
   * @param originDest.x - the x origin of the paste
   * @param originDest.y - the y origin of the paste
   */ copyToTexture(sourceRenderSurfaceTexture, destinationTexture, originSrc, size, originDest) {
        if (originSrc.x < 0) {
            size.width += originSrc.x;
            originDest.x -= originSrc.x;
            originSrc.x = 0;
        }
        if (originSrc.y < 0) {
            size.height += originSrc.y;
            originDest.y -= originSrc.y;
            originSrc.y = 0;
        }
        const { pixelWidth, pixelHeight } = sourceRenderSurfaceTexture;
        size.width = Math.min(size.width, pixelWidth - originSrc.x);
        size.height = Math.min(size.height, pixelHeight - originSrc.y);
        return this.adaptor.copyToTexture(sourceRenderSurfaceTexture, destinationTexture, originSrc, size, originDest);
    }
    /**
   * ensures that we have a depth stencil buffer available to render to
   * This is used by the mask system to make sure we have a stencil buffer.
   */ ensureDepthStencil() {
        if (!this.renderTarget.stencil) {
            this.renderTarget.stencil = true;
            this.adaptor.startRenderPass(this.renderTarget, false, null, this.viewport);
        }
    }
    /** nukes the render target system */ destroy() {
        this._renderer = null;
        this._renderSurfaceToRenderTargetHash.forEach((renderTarget, key)=>{
            if (renderTarget !== key) {
                renderTarget.destroy();
            }
        });
        this._renderSurfaceToRenderTargetHash.clear();
        this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null);
    }
    _initRenderTarget(renderSurface) {
        let renderTarget = null;
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasSource"].test(renderSurface)) {
            renderSurface = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$utils$2f$getCanvasTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCanvasTexture"])(renderSurface).source;
        }
        if (renderSurface instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderTarget"]) {
            renderTarget = renderSurface;
        } else if (renderSurface instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"]) {
            renderTarget = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderTarget"]({
                colorTextures: [
                    renderSurface
                ]
            });
            if (renderSurface.source instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasSource"]) {
                renderTarget.isRoot = true;
            }
            renderSurface.once("destroy", ()=>{
                renderTarget.destroy();
                this._renderSurfaceToRenderTargetHash.delete(renderSurface);
                const gpuRenderTarget = this._gpuRenderTargetHash[renderTarget.uid];
                if (gpuRenderTarget) {
                    this._gpuRenderTargetHash[renderTarget.uid] = null;
                    this.adaptor.destroyGpuRenderTarget(gpuRenderTarget);
                }
            });
        }
        this._renderSurfaceToRenderTargetHash.set(renderSurface, renderTarget);
        return renderTarget;
    }
    getGpuRenderTarget(renderTarget) {
        return this._gpuRenderTargetHash[renderTarget.uid] || (this._gpuRenderTargetHash[renderTarget.uid] = this.adaptor.initGpuRenderTarget(renderTarget));
    }
    resetState() {
        this.renderTarget = null;
        this.renderSurface = null;
    }
}
;
 //# sourceMappingURL=RenderTargetSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTarget.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuRenderTarget",
    ()=>GpuRenderTarget
]);
"use strict";
class GpuRenderTarget {
    constructor(){
        this.contexts = [];
        this.msaaTextures = [];
        this.msaaSamples = 1;
    }
}
;
 //# sourceMappingURL=GpuRenderTarget.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTargetAdaptor.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuRenderTargetAdaptor",
    ()=>GpuRenderTargetAdaptor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/CanvasSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$renderTarget$2f$GpuRenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTarget.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
class GpuRenderTargetAdaptor {
    init(renderer, renderTargetSystem) {
        this._renderer = renderer;
        this._renderTargetSystem = renderTargetSystem;
    }
    copyToTexture(sourceRenderSurfaceTexture, destinationTexture, originSrc, size, originDest) {
        const renderer = this._renderer;
        const baseGpuTexture = this._getGpuColorTexture(sourceRenderSurfaceTexture);
        const backGpuTexture = renderer.texture.getGpuSource(destinationTexture.source);
        renderer.encoder.commandEncoder.copyTextureToTexture({
            texture: baseGpuTexture,
            origin: originSrc
        }, {
            texture: backGpuTexture,
            origin: originDest
        }, size);
        return destinationTexture;
    }
    startRenderPass(renderTarget, clear = true, clearColor, viewport) {
        const renderTargetSystem = this._renderTargetSystem;
        const gpuRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
        const descriptor = this.getDescriptor(renderTarget, clear, clearColor);
        gpuRenderTarget.descriptor = descriptor;
        this._renderer.pipeline.setRenderTarget(gpuRenderTarget);
        this._renderer.encoder.beginRenderPass(gpuRenderTarget);
        this._renderer.encoder.setViewport(viewport);
    }
    finishRenderPass() {
        this._renderer.encoder.endRenderPass();
    }
    /**
   * returns the gpu texture for the first color texture in the render target
   * mainly used by the filter manager to get copy the texture for blending
   * @param renderTarget
   * @returns a gpu texture
   */ _getGpuColorTexture(renderTarget) {
        const gpuRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
        if (gpuRenderTarget.contexts[0]) {
            return gpuRenderTarget.contexts[0].getCurrentTexture();
        }
        return this._renderer.texture.getGpuSource(renderTarget.colorTextures[0].source);
    }
    getDescriptor(renderTarget, clear, clearValue) {
        if (typeof clear === "boolean") {
            clear = clear ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].ALL : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].NONE;
        }
        const renderTargetSystem = this._renderTargetSystem;
        const gpuRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
        const colorAttachments = renderTarget.colorTextures.map((texture, i)=>{
            const context = gpuRenderTarget.contexts[i];
            let view;
            let resolveTarget;
            if (context) {
                const currentTexture = context.getCurrentTexture();
                const canvasTextureView = currentTexture.createView();
                view = canvasTextureView;
            } else {
                view = this._renderer.texture.getGpuSource(texture).createView({
                    mipLevelCount: 1
                });
            }
            if (gpuRenderTarget.msaaTextures[i]) {
                resolveTarget = view;
                view = this._renderer.texture.getTextureView(gpuRenderTarget.msaaTextures[i]);
            }
            const loadOp = clear & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].COLOR ? "clear" : "load";
            clearValue ?? (clearValue = renderTargetSystem.defaultClearColor);
            return {
                view,
                resolveTarget,
                clearValue,
                storeOp: "store",
                loadOp
            };
        });
        let depthStencilAttachment;
        if ((renderTarget.stencil || renderTarget.depth) && !renderTarget.depthStencilTexture) {
            renderTarget.ensureDepthStencilTexture();
            renderTarget.depthStencilTexture.source.sampleCount = gpuRenderTarget.msaa ? 4 : 1;
        }
        if (renderTarget.depthStencilTexture) {
            const stencilLoadOp = clear & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].STENCIL ? "clear" : "load";
            const depthLoadOp = clear & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].DEPTH ? "clear" : "load";
            depthStencilAttachment = {
                view: this._renderer.texture.getGpuSource(renderTarget.depthStencilTexture.source).createView(),
                stencilStoreOp: "store",
                stencilLoadOp,
                depthClearValue: 1,
                depthLoadOp,
                depthStoreOp: "store"
            };
        }
        const descriptor = {
            colorAttachments,
            depthStencilAttachment
        };
        return descriptor;
    }
    clear(renderTarget, clear = true, clearColor, viewport) {
        if (!clear) return;
        const { gpu, encoder } = this._renderer;
        const device = gpu.device;
        const standAlone = encoder.commandEncoder === null;
        if (standAlone) {
            const commandEncoder = device.createCommandEncoder();
            const renderPassDescriptor = this.getDescriptor(renderTarget, clear, clearColor);
            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            passEncoder.setViewport(viewport.x, viewport.y, viewport.width, viewport.height, 0, 1);
            passEncoder.end();
            const gpuCommands = commandEncoder.finish();
            device.queue.submit([
                gpuCommands
            ]);
        } else {
            this.startRenderPass(renderTarget, clear, clearColor, viewport);
        }
    }
    initGpuRenderTarget(renderTarget) {
        renderTarget.isRoot = true;
        const gpuRenderTarget = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$renderTarget$2f$GpuRenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuRenderTarget"]();
        renderTarget.colorTextures.forEach((colorTexture, i)=>{
            if (colorTexture instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasSource"]) {
                const context = colorTexture.resource.getContext("webgpu");
                const alphaMode = colorTexture.transparent ? "premultiplied" : "opaque";
                try {
                    context.configure({
                        device: this._renderer.gpu.device,
                        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
                        format: "bgra8unorm",
                        alphaMode
                    });
                } catch (e) {
                    console.error(e);
                }
                gpuRenderTarget.contexts[i] = context;
            }
            gpuRenderTarget.msaa = colorTexture.source.antialias;
            if (colorTexture.source.antialias) {
                const msaaTexture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"]({
                    width: 0,
                    height: 0,
                    sampleCount: 4
                });
                gpuRenderTarget.msaaTextures[i] = msaaTexture;
            }
        });
        if (gpuRenderTarget.msaa) {
            gpuRenderTarget.msaaSamples = 4;
            if (renderTarget.depthStencilTexture) {
                renderTarget.depthStencilTexture.source.sampleCount = 4;
            }
        }
        return gpuRenderTarget;
    }
    destroyGpuRenderTarget(gpuRenderTarget) {
        gpuRenderTarget.contexts.forEach((context)=>{
            context.unconfigure();
        });
        gpuRenderTarget.msaaTextures.forEach((texture)=>{
            texture.destroy();
        });
        gpuRenderTarget.msaaTextures.length = 0;
        gpuRenderTarget.contexts.length = 0;
    }
    ensureDepthStencilTexture(renderTarget) {
        const gpuRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
        if (renderTarget.depthStencilTexture && gpuRenderTarget.msaa) {
            renderTarget.depthStencilTexture.source.sampleCount = 4;
        }
    }
    resizeGpuRenderTarget(renderTarget) {
        const gpuRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
        gpuRenderTarget.width = renderTarget.width;
        gpuRenderTarget.height = renderTarget.height;
        if (gpuRenderTarget.msaa) {
            renderTarget.colorTextures.forEach((colorTexture, i)=>{
                const msaaTexture = gpuRenderTarget.msaaTextures[i];
                msaaTexture?.resize(colorTexture.source.width, colorTexture.source.height, colorTexture.source._resolution);
            });
        }
    }
}
;
 //# sourceMappingURL=GpuRenderTargetAdaptor.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTargetSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuRenderTargetSystem",
    ()=>GpuRenderTargetSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTargetSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/RenderTargetSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$renderTarget$2f$GpuRenderTargetAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTargetAdaptor.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class GpuRenderTargetSystem extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTargetSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderTargetSystem"] {
    constructor(renderer){
        super(renderer);
        this.adaptor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$renderTarget$2f$GpuRenderTargetAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuRenderTargetAdaptor"]();
        this.adaptor.init(renderer, this);
    }
}
/** @ignore */ GpuRenderTargetSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "renderTarget"
};
;
 //# sourceMappingURL=GpuRenderTargetSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuShaderSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuShaderSystem",
    ()=>GpuShaderSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class GpuShaderSystem {
    constructor(){
        this._gpuProgramData = /* @__PURE__ */ Object.create(null);
    }
    contextChange(gpu) {
        this._gpu = gpu;
    }
    getProgramData(program) {
        return this._gpuProgramData[program._layoutKey] || this._createGPUProgramData(program);
    }
    _createGPUProgramData(program) {
        const device = this._gpu.device;
        const bindGroups = program.gpuLayout.map((group)=>device.createBindGroupLayout({
                entries: group
            }));
        const pipelineLayoutDesc = {
            bindGroupLayouts: bindGroups
        };
        this._gpuProgramData[program._layoutKey] = {
            bindGroups,
            pipeline: device.createPipelineLayout(pipelineLayoutDesc)
        };
        return this._gpuProgramData[program._layoutKey];
    }
    destroy() {
        this._gpu = null;
        this._gpuProgramData = null;
    }
}
/** @ignore */ GpuShaderSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "shader"
};
;
 //# sourceMappingURL=GpuShaderSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuBlendModesToPixi.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuBlendModesToPixi",
    ()=>GpuBlendModesToPixi
]);
"use strict";
const GpuBlendModesToPixi = {};
GpuBlendModesToPixi.normal = {
    alpha: {
        srcFactor: "one",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    },
    color: {
        srcFactor: "one",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    }
};
GpuBlendModesToPixi.add = {
    alpha: {
        srcFactor: "src-alpha",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    },
    color: {
        srcFactor: "one",
        dstFactor: "one",
        operation: "add"
    }
};
GpuBlendModesToPixi.multiply = {
    alpha: {
        srcFactor: "one",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    },
    color: {
        srcFactor: "dst",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    }
};
GpuBlendModesToPixi.screen = {
    alpha: {
        srcFactor: "one",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    },
    color: {
        srcFactor: "one",
        dstFactor: "one-minus-src",
        operation: "add"
    }
};
GpuBlendModesToPixi.overlay = {
    alpha: {
        srcFactor: "one",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    },
    color: {
        srcFactor: "one",
        dstFactor: "one-minus-src",
        operation: "add"
    }
};
GpuBlendModesToPixi.none = {
    alpha: {
        srcFactor: "one",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    },
    color: {
        srcFactor: "zero",
        dstFactor: "zero",
        operation: "add"
    }
};
GpuBlendModesToPixi["normal-npm"] = {
    alpha: {
        srcFactor: "one",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    },
    color: {
        srcFactor: "src-alpha",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    }
};
GpuBlendModesToPixi["add-npm"] = {
    alpha: {
        srcFactor: "one",
        dstFactor: "one",
        operation: "add"
    },
    color: {
        srcFactor: "src-alpha",
        dstFactor: "one",
        operation: "add"
    }
};
GpuBlendModesToPixi["screen-npm"] = {
    alpha: {
        srcFactor: "one",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    },
    color: {
        srcFactor: "src-alpha",
        dstFactor: "one-minus-src",
        operation: "add"
    }
};
GpuBlendModesToPixi.erase = {
    alpha: {
        srcFactor: "zero",
        dstFactor: "one-minus-src-alpha",
        operation: "add"
    },
    color: {
        srcFactor: "zero",
        dstFactor: "one-minus-src",
        operation: "add"
    }
};
GpuBlendModesToPixi.min = {
    alpha: {
        srcFactor: "one",
        dstFactor: "one",
        operation: "min"
    },
    color: {
        srcFactor: "one",
        dstFactor: "one",
        operation: "min"
    }
};
GpuBlendModesToPixi.max = {
    alpha: {
        srcFactor: "one",
        dstFactor: "one",
        operation: "max"
    },
    color: {
        srcFactor: "one",
        dstFactor: "one",
        operation: "max"
    }
};
;
 //# sourceMappingURL=GpuBlendModesToPixi.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuStateSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuStateSystem",
    ()=>GpuStateSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$state$2f$GpuBlendModesToPixi$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuBlendModesToPixi.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class GpuStateSystem {
    constructor(){
        this.defaultState = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"]();
        this.defaultState.blend = true;
    }
    contextChange(gpu) {
        this.gpu = gpu;
    }
    /**
   * Gets the blend mode data for the current state
   * @param state - The state to get the blend mode from
   */ getColorTargets(state) {
        const blend = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$state$2f$GpuBlendModesToPixi$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuBlendModesToPixi"][state.blendMode] || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$state$2f$GpuBlendModesToPixi$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuBlendModesToPixi"].normal;
        return [
            {
                format: "bgra8unorm",
                writeMask: 0,
                blend
            }
        ];
    }
    destroy() {
        this.gpu = null;
    }
}
/** @ignore */ GpuStateSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "state"
};
;
 //# sourceMappingURL=GpuStateSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadBufferImageResource.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "gpuUploadBufferImageResource",
    ()=>gpuUploadBufferImageResource
]);
"use strict";
const gpuUploadBufferImageResource = {
    type: "image",
    upload (source, gpuTexture, gpu) {
        const resource = source.resource;
        const total = (source.pixelWidth | 0) * (source.pixelHeight | 0);
        const bytesPerPixel = resource.byteLength / total;
        gpu.device.queue.writeTexture({
            texture: gpuTexture
        }, resource, {
            offset: 0,
            rowsPerImage: source.pixelHeight,
            bytesPerRow: source.pixelHeight * bytesPerPixel
        }, {
            width: source.pixelWidth,
            height: source.pixelHeight,
            depthOrArrayLayers: 1
        });
    }
};
;
 //# sourceMappingURL=gpuUploadBufferImageResource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadCompressedTextureResource.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "blockDataMap",
    ()=>blockDataMap,
    "gpuUploadCompressedTextureResource",
    ()=>gpuUploadCompressedTextureResource
]);
"use strict";
const blockDataMap = {
    "bc1-rgba-unorm": {
        blockBytes: 8,
        blockWidth: 4,
        blockHeight: 4
    },
    "bc2-rgba-unorm": {
        blockBytes: 16,
        blockWidth: 4,
        blockHeight: 4
    },
    "bc3-rgba-unorm": {
        blockBytes: 16,
        blockWidth: 4,
        blockHeight: 4
    },
    "bc7-rgba-unorm": {
        blockBytes: 16,
        blockWidth: 4,
        blockHeight: 4
    },
    "etc1-rgb-unorm": {
        blockBytes: 8,
        blockWidth: 4,
        blockHeight: 4
    },
    "etc2-rgba8unorm": {
        blockBytes: 16,
        blockWidth: 4,
        blockHeight: 4
    },
    "astc-4x4-unorm": {
        blockBytes: 16,
        blockWidth: 4,
        blockHeight: 4
    }
};
const defaultBlockData = {
    blockBytes: 4,
    blockWidth: 1,
    blockHeight: 1
};
const gpuUploadCompressedTextureResource = {
    type: "compressed",
    upload (source, gpuTexture, gpu) {
        let mipWidth = source.pixelWidth;
        let mipHeight = source.pixelHeight;
        const blockData = blockDataMap[source.format] || defaultBlockData;
        for(let i = 0; i < source.resource.length; i++){
            const levelBuffer = source.resource[i];
            const bytesPerRow = Math.ceil(mipWidth / blockData.blockWidth) * blockData.blockBytes;
            gpu.device.queue.writeTexture({
                texture: gpuTexture,
                mipLevel: i
            }, levelBuffer, {
                offset: 0,
                bytesPerRow
            }, {
                width: Math.ceil(mipWidth / blockData.blockWidth) * blockData.blockWidth,
                height: Math.ceil(mipHeight / blockData.blockHeight) * blockData.blockHeight,
                depthOrArrayLayers: 1
            });
            mipWidth = Math.max(mipWidth >> 1, 1);
            mipHeight = Math.max(mipHeight >> 1, 1);
        }
    }
};
;
 //# sourceMappingURL=gpuUploadCompressedTextureResource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadImageSource.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "gpuUploadImageResource",
    ()=>gpuUploadImageResource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
const gpuUploadImageResource = {
    type: "image",
    upload (source, gpuTexture, gpu) {
        const resource = source.resource;
        if (!resource) return;
        if (globalThis.HTMLImageElement && resource instanceof HTMLImageElement) {
            const canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas(resource.width, resource.height);
            const context = canvas.getContext("2d");
            context.drawImage(resource, 0, 0, resource.width, resource.height);
            source.resource = canvas;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("ImageSource: Image element passed, converting to canvas and replacing resource.");
        }
        const width = Math.min(gpuTexture.width, source.resourceWidth || source.pixelWidth);
        const height = Math.min(gpuTexture.height, source.resourceHeight || source.pixelHeight);
        const premultipliedAlpha = source.alphaMode === "premultiply-alpha-on-upload";
        gpu.device.queue.copyExternalImageToTexture({
            source: resource
        }, {
            texture: gpuTexture,
            premultipliedAlpha
        }, {
            width,
            height
        });
    }
};
;
 //# sourceMappingURL=gpuUploadImageSource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadVideoSource.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "gpuUploadVideoResource",
    ()=>gpuUploadVideoResource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$uploaders$2f$gpuUploadImageSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadImageSource.mjs [app-ssr] (ecmascript)");
;
"use strict";
const gpuUploadVideoResource = {
    type: "video",
    upload (source, gpuTexture, gpu) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$uploaders$2f$gpuUploadImageSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["gpuUploadImageResource"].upload(source, gpuTexture, gpu);
    }
};
;
 //# sourceMappingURL=gpuUploadVideoSource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/utils/GpuMipmapGenerator.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuMipmapGenerator",
    ()=>GpuMipmapGenerator
]);
"use strict";
class GpuMipmapGenerator {
    constructor(device){
        this.device = device;
        this.sampler = device.createSampler({
            minFilter: "linear"
        });
        this.pipelines = {};
    }
    _getMipmapPipeline(format) {
        let pipeline = this.pipelines[format];
        if (!pipeline) {
            if (!this.mipmapShaderModule) {
                this.mipmapShaderModule = this.device.createShaderModule({
                    code: /* wgsl */ `
                        var<private> pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(
                        vec2<f32>(-1.0, -1.0), vec2<f32>(-1.0, 3.0), vec2<f32>(3.0, -1.0));

                        struct VertexOutput {
                        @builtin(position) position : vec4<f32>,
                        @location(0) texCoord : vec2<f32>,
                        };

                        @vertex
                        fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
                        var output : VertexOutput;
                        output.texCoord = pos[vertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
                        output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
                        return output;
                        }

                        @group(0) @binding(0) var imgSampler : sampler;
                        @group(0) @binding(1) var img : texture_2d<f32>;

                        @fragment
                        fn fragmentMain(@location(0) texCoord : vec2<f32>) -> @location(0) vec4<f32> {
                        return textureSample(img, imgSampler, texCoord);
                        }
                    `
                });
            }
            pipeline = this.device.createRenderPipeline({
                layout: "auto",
                vertex: {
                    module: this.mipmapShaderModule,
                    entryPoint: "vertexMain"
                },
                fragment: {
                    module: this.mipmapShaderModule,
                    entryPoint: "fragmentMain",
                    targets: [
                        {
                            format
                        }
                    ]
                }
            });
            this.pipelines[format] = pipeline;
        }
        return pipeline;
    }
    /**
   * Generates mipmaps for the given GPUTexture from the data in level 0.
   * @param {module:External.GPUTexture} texture - Texture to generate mipmaps for.
   * @returns {module:External.GPUTexture} - The originally passed texture
   */ generateMipmap(texture) {
        const pipeline = this._getMipmapPipeline(texture.format);
        if (texture.dimension === "3d" || texture.dimension === "1d") {
            throw new Error("Generating mipmaps for non-2d textures is currently unsupported!");
        }
        let mipTexture = texture;
        const arrayLayerCount = texture.depthOrArrayLayers || 1;
        const renderToSource = texture.usage & GPUTextureUsage.RENDER_ATTACHMENT;
        if (!renderToSource) {
            const mipTextureDescriptor = {
                size: {
                    width: Math.ceil(texture.width / 2),
                    height: Math.ceil(texture.height / 2),
                    depthOrArrayLayers: arrayLayerCount
                },
                format: texture.format,
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
                mipLevelCount: texture.mipLevelCount - 1
            };
            mipTexture = this.device.createTexture(mipTextureDescriptor);
        }
        const commandEncoder = this.device.createCommandEncoder({});
        const bindGroupLayout = pipeline.getBindGroupLayout(0);
        for(let arrayLayer = 0; arrayLayer < arrayLayerCount; ++arrayLayer){
            let srcView = texture.createView({
                baseMipLevel: 0,
                mipLevelCount: 1,
                dimension: "2d",
                baseArrayLayer: arrayLayer,
                arrayLayerCount: 1
            });
            let dstMipLevel = renderToSource ? 1 : 0;
            for(let i = 1; i < texture.mipLevelCount; ++i){
                const dstView = mipTexture.createView({
                    baseMipLevel: dstMipLevel++,
                    mipLevelCount: 1,
                    dimension: "2d",
                    baseArrayLayer: arrayLayer,
                    arrayLayerCount: 1
                });
                const passEncoder = commandEncoder.beginRenderPass({
                    colorAttachments: [
                        {
                            view: dstView,
                            storeOp: "store",
                            loadOp: "clear",
                            clearValue: {
                                r: 0,
                                g: 0,
                                b: 0,
                                a: 0
                            }
                        }
                    ]
                });
                const bindGroup = this.device.createBindGroup({
                    layout: bindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: this.sampler
                        },
                        {
                            binding: 1,
                            resource: srcView
                        }
                    ]
                });
                passEncoder.setPipeline(pipeline);
                passEncoder.setBindGroup(0, bindGroup);
                passEncoder.draw(3, 1, 0, 0);
                passEncoder.end();
                srcView = dstView;
            }
        }
        if (!renderToSource) {
            const mipLevelSize = {
                width: Math.ceil(texture.width / 2),
                height: Math.ceil(texture.height / 2),
                depthOrArrayLayers: arrayLayerCount
            };
            for(let i = 1; i < texture.mipLevelCount; ++i){
                commandEncoder.copyTextureToTexture({
                    texture: mipTexture,
                    mipLevel: i - 1
                }, {
                    texture,
                    mipLevel: i
                }, mipLevelSize);
                mipLevelSize.width = Math.ceil(mipLevelSize.width / 2);
                mipLevelSize.height = Math.ceil(mipLevelSize.height / 2);
            }
        }
        this.device.queue.submit([
            commandEncoder.finish()
        ]);
        if (!renderToSource) {
            mipTexture.destroy();
        }
        return texture;
    }
}
;
 //# sourceMappingURL=GpuMipmapGenerator.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/GpuTextureSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuTextureSystem",
    ()=>GpuTextureSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/CanvasPool.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/BindGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$uploaders$2f$gpuUploadBufferImageResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadBufferImageResource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$uploaders$2f$gpuUploadCompressedTextureResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadCompressedTextureResource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$uploaders$2f$gpuUploadImageSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadImageSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$uploaders$2f$gpuUploadVideoSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadVideoSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$utils$2f$GpuMipmapGenerator$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/utils/GpuMipmapGenerator.mjs [app-ssr] (ecmascript)");
;
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
class GpuTextureSystem {
    constructor(renderer){
        this.managedTextures = [];
        this._gpuSources = /* @__PURE__ */ Object.create(null);
        this._gpuSamplers = /* @__PURE__ */ Object.create(null);
        this._bindGroupHash = /* @__PURE__ */ Object.create(null);
        this._textureViewHash = /* @__PURE__ */ Object.create(null);
        this._uploads = {
            image: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$uploaders$2f$gpuUploadImageSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["gpuUploadImageResource"],
            buffer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$uploaders$2f$gpuUploadBufferImageResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["gpuUploadBufferImageResource"],
            video: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$uploaders$2f$gpuUploadVideoSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["gpuUploadVideoResource"],
            compressed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$uploaders$2f$gpuUploadCompressedTextureResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["gpuUploadCompressedTextureResource"]
        };
        this._renderer = renderer;
        renderer.renderableGC.addManagedHash(this, "_gpuSources");
        renderer.renderableGC.addManagedHash(this, "_gpuSamplers");
        renderer.renderableGC.addManagedHash(this, "_bindGroupHash");
        renderer.renderableGC.addManagedHash(this, "_textureViewHash");
    }
    contextChange(gpu) {
        this._gpu = gpu;
    }
    /**
   * Initializes a texture source, if it has already been initialized nothing will happen.
   * @param source - The texture source to initialize.
   * @returns The initialized texture source.
   */ initSource(source) {
        if (this._gpuSources[source.uid]) {
            return this._gpuSources[source.uid];
        }
        return this._initSource(source);
    }
    _initSource(source) {
        if (source.autoGenerateMipmaps) {
            const biggestDimension = Math.max(source.pixelWidth, source.pixelHeight);
            source.mipLevelCount = Math.floor(Math.log2(biggestDimension)) + 1;
        }
        let usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
        if (source.uploadMethodId !== "compressed") {
            usage |= GPUTextureUsage.RENDER_ATTACHMENT;
            usage |= GPUTextureUsage.COPY_SRC;
        }
        const blockData = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$uploaders$2f$gpuUploadCompressedTextureResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["blockDataMap"][source.format] || {
            blockBytes: 4,
            blockWidth: 1,
            blockHeight: 1
        };
        const width = Math.ceil(source.pixelWidth / blockData.blockWidth) * blockData.blockWidth;
        const height = Math.ceil(source.pixelHeight / blockData.blockHeight) * blockData.blockHeight;
        const textureDescriptor = {
            label: source.label,
            size: {
                width,
                height
            },
            format: source.format,
            sampleCount: source.sampleCount,
            mipLevelCount: source.mipLevelCount,
            dimension: source.dimension,
            usage
        };
        const gpuTexture = this._gpuSources[source.uid] = this._gpu.device.createTexture(textureDescriptor);
        if (!this.managedTextures.includes(source)) {
            source.on("update", this.onSourceUpdate, this);
            source.on("resize", this.onSourceResize, this);
            source.on("destroy", this.onSourceDestroy, this);
            source.on("unload", this.onSourceUnload, this);
            source.on("updateMipmaps", this.onUpdateMipmaps, this);
            this.managedTextures.push(source);
        }
        this.onSourceUpdate(source);
        return gpuTexture;
    }
    onSourceUpdate(source) {
        const gpuTexture = this.getGpuSource(source);
        if (!gpuTexture) return;
        if (this._uploads[source.uploadMethodId]) {
            this._uploads[source.uploadMethodId].upload(source, gpuTexture, this._gpu);
        }
        if (source.autoGenerateMipmaps && source.mipLevelCount > 1) {
            this.onUpdateMipmaps(source);
        }
    }
    onSourceUnload(source) {
        const gpuTexture = this._gpuSources[source.uid];
        if (gpuTexture) {
            this._gpuSources[source.uid] = null;
            gpuTexture.destroy();
        }
    }
    onUpdateMipmaps(source) {
        if (!this._mipmapGenerator) {
            this._mipmapGenerator = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$utils$2f$GpuMipmapGenerator$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuMipmapGenerator"](this._gpu.device);
        }
        const gpuTexture = this.getGpuSource(source);
        this._mipmapGenerator.generateMipmap(gpuTexture);
    }
    onSourceDestroy(source) {
        source.off("update", this.onSourceUpdate, this);
        source.off("unload", this.onSourceUnload, this);
        source.off("destroy", this.onSourceDestroy, this);
        source.off("resize", this.onSourceResize, this);
        source.off("updateMipmaps", this.onUpdateMipmaps, this);
        this.managedTextures.splice(this.managedTextures.indexOf(source), 1);
        this.onSourceUnload(source);
    }
    onSourceResize(source) {
        const gpuTexture = this._gpuSources[source.uid];
        if (!gpuTexture) {
            this.initSource(source);
        } else if (gpuTexture.width !== source.pixelWidth || gpuTexture.height !== source.pixelHeight) {
            this._textureViewHash[source.uid] = null;
            this._bindGroupHash[source.uid] = null;
            this.onSourceUnload(source);
            this.initSource(source);
        }
    }
    _initSampler(sampler) {
        this._gpuSamplers[sampler._resourceId] = this._gpu.device.createSampler(sampler);
        return this._gpuSamplers[sampler._resourceId];
    }
    getGpuSampler(sampler) {
        return this._gpuSamplers[sampler._resourceId] || this._initSampler(sampler);
    }
    getGpuSource(source) {
        return this._gpuSources[source.uid] || this.initSource(source);
    }
    /**
   * this returns s bind group for a specific texture, the bind group contains
   * - the texture source
   * - the texture style
   * - the texture matrix
   * This is cached so the bind group should only be created once per texture
   * @param texture - the texture you want the bindgroup for
   * @returns the bind group for the texture
   */ getTextureBindGroup(texture) {
        return this._bindGroupHash[texture.uid] ?? this._createTextureBindGroup(texture);
    }
    _createTextureBindGroup(texture) {
        const source = texture.source;
        this._bindGroupHash[texture.uid] = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BindGroup"]({
            0: source,
            1: source.style,
            2: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
                uTextureMatrix: {
                    type: "mat3x3<f32>",
                    value: texture.textureMatrix.mapCoord
                }
            })
        });
        return this._bindGroupHash[texture.uid];
    }
    getTextureView(texture) {
        const source = texture.source;
        return this._textureViewHash[source.uid] ?? this._createTextureView(source);
    }
    _createTextureView(texture) {
        this._textureViewHash[texture.uid] = this.getGpuSource(texture).createView();
        return this._textureViewHash[texture.uid];
    }
    generateCanvas(texture) {
        const renderer = this._renderer;
        const commandEncoder = renderer.gpu.device.createCommandEncoder();
        const canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas();
        canvas.width = texture.source.pixelWidth;
        canvas.height = texture.source.pixelHeight;
        const context = canvas.getContext("webgpu");
        context.configure({
            device: renderer.gpu.device,
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
            format: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getNavigator().gpu.getPreferredCanvasFormat(),
            alphaMode: "premultiplied"
        });
        commandEncoder.copyTextureToTexture({
            texture: renderer.texture.getGpuSource(texture.source),
            origin: {
                x: 0,
                y: 0
            }
        }, {
            texture: context.getCurrentTexture()
        }, {
            width: canvas.width,
            height: canvas.height
        });
        renderer.gpu.device.queue.submit([
            commandEncoder.finish()
        ]);
        return canvas;
    }
    getPixels(texture) {
        const webGPUCanvas = this.generateCanvas(texture);
        const canvasAndContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasPool"].getOptimalCanvasAndContext(webGPUCanvas.width, webGPUCanvas.height);
        const context = canvasAndContext.context;
        context.drawImage(webGPUCanvas, 0, 0);
        const { width, height } = webGPUCanvas;
        const imageData = context.getImageData(0, 0, width, height);
        const pixels = new Uint8ClampedArray(imageData.data.buffer);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasPool"].returnCanvasAndContext(canvasAndContext);
        return {
            pixels,
            width,
            height
        };
    }
    destroy() {
        this.managedTextures.slice().forEach((source)=>this.onSourceDestroy(source));
        this.managedTextures = null;
        for (const k of Object.keys(this._bindGroupHash)){
            const key = Number(k);
            const bindGroup = this._bindGroupHash[key];
            bindGroup?.destroy();
            this._bindGroupHash[key] = null;
        }
        this._gpu = null;
        this._mipmapGenerator = null;
        this._gpuSources = null;
        this._bindGroupHash = null;
        this._textureViewHash = null;
        this._gpuSamplers = null;
    }
}
/** @ignore */ GpuTextureSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "texture"
};
;
 //# sourceMappingURL=GpuTextureSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/WebGPURenderer.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WebGPURenderer",
    ()=>WebGPURenderer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$GpuGraphicsAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gpu/GpuGraphicsAdaptor.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$gpu$2f$GpuMeshAdapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/gpu/GpuMeshAdapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gpu$2f$GpuBatchAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gpu/GpuBatchAdaptor.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$AbstractRenderer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/AbstractRenderer.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SharedSystems$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/SharedSystems.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$BindGroupSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/BindGroupSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$buffer$2f$GpuBufferSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/GpuBufferSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuColorMaskSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuColorMaskSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuDeviceSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuDeviceSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuEncoderSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuEncoderSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuLimitsSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuLimitsSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuStencilSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuStencilSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuUboSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuUboSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuUniformBatchPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuUniformBatchPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$pipeline$2f$PipelineSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/pipeline/PipelineSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$renderTarget$2f$GpuRenderTargetSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTargetSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuShaderSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuShaderSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$state$2f$GpuStateSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuStateSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$GpuTextureSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/GpuTextureSystem.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
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
const DefaultWebGPUSystems = [
    ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SharedSystems$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SharedSystems"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuUboSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuUboSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuEncoderSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuEncoderSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuDeviceSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuDeviceSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuLimitsSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuLimitsSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$buffer$2f$GpuBufferSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuBufferSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$texture$2f$GpuTextureSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuTextureSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$renderTarget$2f$GpuRenderTargetSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuRenderTargetSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuShaderSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuShaderSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$state$2f$GpuStateSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuStateSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$pipeline$2f$PipelineSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PipelineSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuColorMaskSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuColorMaskSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuStencilSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuStencilSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$BindGroupSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BindGroupSystem"]
];
const DefaultWebGPUPipes = [
    ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SharedSystems$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SharedRenderPipes"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$GpuUniformBatchPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuUniformBatchPipe"]
];
const DefaultWebGPUAdapters = [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gpu$2f$GpuBatchAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuBatchAdaptor"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$gpu$2f$GpuMeshAdapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuMeshAdapter"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$GpuGraphicsAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuGraphicsAdaptor"]
];
const systems = [];
const renderPipes = [];
const renderPipeAdaptors = [];
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handleByNamedList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem, systems);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handleByNamedList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes, renderPipes);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handleByNamedList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipesAdaptor, renderPipeAdaptors);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(...DefaultWebGPUSystems, ...DefaultWebGPUPipes, ...DefaultWebGPUAdapters);
class WebGPURenderer extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$AbstractRenderer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AbstractRenderer"] {
    constructor(){
        const systemConfig = {
            name: "webgpu",
            type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererType"].WEBGPU,
            systems,
            renderPipes,
            renderPipeAdaptors
        };
        super(systemConfig);
    }
}
;
 //# sourceMappingURL=WebGPURenderer.mjs.map
}),
];

//# sourceMappingURL=5703a_pixi_js_lib_b18a936b._.js.map