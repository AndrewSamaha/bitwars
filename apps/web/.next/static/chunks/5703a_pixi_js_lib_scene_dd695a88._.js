(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/definedProps.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "definedProps",
    ()=>definedProps
]);
"use strict";
function definedProps(obj) {
    const result = {};
    for(const key in obj){
        if (obj[key] !== void 0) {
            result[key] = obj[key];
        }
    }
    return result;
}
;
 //# sourceMappingURL=definedProps.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Bounds",
    ()=>Bounds
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
;
;
"use strict";
const defaultMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
class Bounds {
    /**
   * Checks if bounds are empty, meaning either width or height is zero or negative.
   * Empty bounds occur when min values exceed max values on either axis.
   * @example
   * ```ts
   * const bounds = new Bounds();
   *
   * // Check if newly created bounds are empty
   * console.log(bounds.isEmpty()); // true, default bounds are empty
   *
   * // Add frame and check again
   * bounds.addFrame(0, 0, 100, 100);
   * console.log(bounds.isEmpty()); // false, bounds now have area
   *
   * // Clear bounds
   * bounds.clear();
   * console.log(bounds.isEmpty()); // true, bounds are empty again
   * ```
   * @returns True if bounds are empty (have no area)
   * @see {@link Bounds#clear} For resetting bounds
   * @see {@link Bounds#isValid} For checking validity
   */ isEmpty() {
        return this.minX > this.maxX || this.minY > this.maxY;
    }
    /**
   * The bounding rectangle representation of these bounds.
   * Lazily creates and updates a Rectangle instance based on the current bounds.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   *
   * // Get rectangle representation
   * const rect = bounds.rectangle;
   * console.log(rect.x, rect.y, rect.width, rect.height);
   *
   * // Use for hit testing
   * if (bounds.rectangle.contains(mouseX, mouseY)) {
   *     console.log('Mouse is inside bounds!');
   * }
   * ```
   * @see {@link Rectangle} For rectangle methods
   * @see {@link Bounds.isEmpty} For bounds validation
   */ get rectangle() {
        if (!this._rectangle) {
            this._rectangle = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"]();
        }
        const rectangle = this._rectangle;
        if (this.minX > this.maxX || this.minY > this.maxY) {
            rectangle.x = 0;
            rectangle.y = 0;
            rectangle.width = 0;
            rectangle.height = 0;
        } else {
            rectangle.copyFromBounds(this);
        }
        return rectangle;
    }
    /**
   * Clears the bounds and resets all coordinates to their default values.
   * Resets the transformation matrix back to identity.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * console.log(bounds.isEmpty()); // false
   * // Clear the bounds
   * bounds.clear();
   * console.log(bounds.isEmpty()); // true
   * ```
   * @returns This bounds object for chaining
   */ clear() {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.matrix = defaultMatrix;
        return this;
    }
    /**
   * Sets the bounds directly using coordinate values.
   * Provides a way to set all bounds values at once.
   * @example
   * ```ts
   * const bounds = new Bounds();
   * bounds.set(0, 0, 100, 100);
   * ```
   * @param x0 - Left X coordinate of frame
   * @param y0 - Top Y coordinate of frame
   * @param x1 - Right X coordinate of frame
   * @param y1 - Bottom Y coordinate of frame
   * @see {@link Bounds#addFrame} For matrix-aware bounds setting
   * @see {@link Bounds#clear} For resetting bounds
   */ set(x0, y0, x1, y1) {
        this.minX = x0;
        this.minY = y0;
        this.maxX = x1;
        this.maxY = y1;
    }
    /**
   * Adds a rectangular frame to the bounds, optionally transformed by a matrix.
   * Updates the bounds to encompass the new frame coordinates.
   * @example
   * ```ts
   * const bounds = new Bounds();
   * bounds.addFrame(0, 0, 100, 100);
   *
   * // Add transformed frame
   * const matrix = new Matrix()
   *     .translate(50, 50)
   *     .rotate(Math.PI / 4);
   * bounds.addFrame(0, 0, 100, 100, matrix);
   * ```
   * @param x0 - Left X coordinate of frame
   * @param y0 - Top Y coordinate of frame
   * @param x1 - Right X coordinate of frame
   * @param y1 - Bottom Y coordinate of frame
   * @param matrix - Optional transformation matrix
   * @see {@link Bounds#addRect} For adding Rectangle objects
   * @see {@link Bounds#addBounds} For adding other Bounds
   */ addFrame(x0, y0, x1, y1, matrix) {
        matrix || (matrix = this.matrix);
        const a = matrix.a;
        const b = matrix.b;
        const c = matrix.c;
        const d = matrix.d;
        const tx = matrix.tx;
        const ty = matrix.ty;
        let minX = this.minX;
        let minY = this.minY;
        let maxX = this.maxX;
        let maxY = this.maxY;
        let x = a * x0 + c * y0 + tx;
        let y = b * x0 + d * y0 + ty;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        x = a * x1 + c * y0 + tx;
        y = b * x1 + d * y0 + ty;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        x = a * x0 + c * y1 + tx;
        y = b * x0 + d * y1 + ty;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        x = a * x1 + c * y1 + tx;
        y = b * x1 + d * y1 + ty;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }
    /**
   * Adds a rectangle to the bounds, optionally transformed by a matrix.
   * Updates the bounds to encompass the given rectangle.
   * @example
   * ```ts
   * const bounds = new Bounds();
   * // Add simple rectangle
   * const rect = new Rectangle(0, 0, 100, 100);
   * bounds.addRect(rect);
   *
   * // Add transformed rectangle
   * const matrix = new Matrix()
   *     .translate(50, 50)
   *     .rotate(Math.PI / 4);
   * bounds.addRect(rect, matrix);
   * ```
   * @param rect - The rectangle to be added
   * @param matrix - Optional transformation matrix
   * @see {@link Bounds#addFrame} For adding raw coordinates
   * @see {@link Bounds#addBounds} For adding other bounds
   */ addRect(rect, matrix) {
        this.addFrame(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height, matrix);
    }
    /**
   * Adds another bounds object to this one, optionally transformed by a matrix.
   * Expands the bounds to include the given bounds' area.
   * @example
   * ```ts
   * const bounds = new Bounds();
   *
   * // Add child bounds
   * const childBounds = sprite.getBounds();
   * bounds.addBounds(childBounds);
   *
   * // Add transformed bounds
   * const matrix = new Matrix()
   *     .scale(2, 2);
   * bounds.addBounds(childBounds, matrix);
   * ```
   * @param bounds - The bounds to be added
   * @param matrix - Optional transformation matrix
   * @see {@link Bounds#addFrame} For adding raw coordinates
   * @see {@link Bounds#addRect} For adding rectangles
   */ addBounds(bounds, matrix) {
        this.addFrame(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, matrix);
    }
    /**
   * Adds other Bounds as a mask, creating an intersection of the two bounds.
   * Only keeps the overlapping region between current bounds and mask bounds.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Create mask bounds
   * const mask = new Bounds();
   * mask.addFrame(50, 50, 150, 150);
   * // Apply mask - results in bounds of (50,50,100,100)
   * bounds.addBoundsMask(mask);
   * ```
   * @param mask - The Bounds to use as a mask
   * @see {@link Bounds#addBounds} For union operation
   * @see {@link Bounds#fit} For fitting to rectangle
   */ addBoundsMask(mask) {
        this.minX = this.minX > mask.minX ? this.minX : mask.minX;
        this.minY = this.minY > mask.minY ? this.minY : mask.minY;
        this.maxX = this.maxX < mask.maxX ? this.maxX : mask.maxX;
        this.maxY = this.maxY < mask.maxY ? this.maxY : mask.maxY;
    }
    /**
   * Applies a transformation matrix to the bounds, updating its coordinates.
   * Transforms all corners of the bounds using the given matrix.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Apply translation
   * const translateMatrix = new Matrix()
   *     .translate(50, 50);
   * bounds.applyMatrix(translateMatrix);
   * ```
   * @param matrix - The matrix to apply to the bounds
   * @see {@link Matrix} For matrix operations
   * @see {@link Bounds#addFrame} For adding transformed frames
   */ applyMatrix(matrix) {
        const minX = this.minX;
        const minY = this.minY;
        const maxX = this.maxX;
        const maxY = this.maxY;
        const { a, b, c, d, tx, ty } = matrix;
        let x = a * minX + c * minY + tx;
        let y = b * minX + d * minY + ty;
        this.minX = x;
        this.minY = y;
        this.maxX = x;
        this.maxY = y;
        x = a * maxX + c * minY + tx;
        y = b * maxX + d * minY + ty;
        this.minX = x < this.minX ? x : this.minX;
        this.minY = y < this.minY ? y : this.minY;
        this.maxX = x > this.maxX ? x : this.maxX;
        this.maxY = y > this.maxY ? y : this.maxY;
        x = a * minX + c * maxY + tx;
        y = b * minX + d * maxY + ty;
        this.minX = x < this.minX ? x : this.minX;
        this.minY = y < this.minY ? y : this.minY;
        this.maxX = x > this.maxX ? x : this.maxX;
        this.maxY = y > this.maxY ? y : this.maxY;
        x = a * maxX + c * maxY + tx;
        y = b * maxX + d * maxY + ty;
        this.minX = x < this.minX ? x : this.minX;
        this.minY = y < this.minY ? y : this.minY;
        this.maxX = x > this.maxX ? x : this.maxX;
        this.maxY = y > this.maxY ? y : this.maxY;
    }
    /**
   * Resizes the bounds object to fit within the given rectangle.
   * Clips the bounds if they extend beyond the rectangle's edges.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 200, 200);
   * // Fit within viewport
   * const viewport = new Rectangle(50, 50, 100, 100);
   * bounds.fit(viewport);
   * // bounds are now (50, 50, 150, 150)
   * ```
   * @param rect - The rectangle to fit within
   * @returns This bounds object for chaining
   * @see {@link Bounds#addBoundsMask} For intersection
   * @see {@link Bounds#pad} For expanding bounds
   */ fit(rect) {
        if (this.minX < rect.left) this.minX = rect.left;
        if (this.maxX > rect.right) this.maxX = rect.right;
        if (this.minY < rect.top) this.minY = rect.top;
        if (this.maxY > rect.bottom) this.maxY = rect.bottom;
        return this;
    }
    /**
   * Resizes the bounds object to include the given bounds.
   * Similar to fit() but works with raw coordinate values instead of a Rectangle.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 200, 200);
   * // Fit to specific coordinates
   * bounds.fitBounds(50, 150, 50, 150);
   * // bounds are now (50, 50, 150, 150)
   * ```
   * @param left - The left value of the bounds
   * @param right - The right value of the bounds
   * @param top - The top value of the bounds
   * @param bottom - The bottom value of the bounds
   * @returns This bounds object for chaining
   * @see {@link Bounds#fit} For fitting to Rectangle
   * @see {@link Bounds#addBoundsMask} For intersection
   */ fitBounds(left, right, top, bottom) {
        if (this.minX < left) this.minX = left;
        if (this.maxX > right) this.maxX = right;
        if (this.minY < top) this.minY = top;
        if (this.maxY > bottom) this.maxY = bottom;
        return this;
    }
    /**
   * Pads bounds object, making it grow in all directions.
   * If paddingY is omitted, both paddingX and paddingY will be set to paddingX.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   *
   * // Add equal padding
   * bounds.pad(10);
   * // bounds are now (-10, -10, 110, 110)
   *
   * // Add different padding for x and y
   * bounds.pad(20, 10);
   * // bounds are now (-30, -20, 130, 120)
   * ```
   * @param paddingX - The horizontal padding amount
   * @param paddingY - The vertical padding amount
   * @returns This bounds object for chaining
   * @see {@link Bounds#fit} For constraining bounds
   * @see {@link Bounds#scale} For uniform scaling
   */ pad(paddingX) {
        let paddingY = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : paddingX;
        this.minX -= paddingX;
        this.maxX += paddingX;
        this.minY -= paddingY;
        this.maxY += paddingY;
        return this;
    }
    /**
   * Ceils the bounds by rounding up max values and rounding down min values.
   * Useful for pixel-perfect calculations and avoiding fractional pixels.
   * @example
   * ```ts
   * const bounds = new Bounds();
   * bounds.set(10.2, 10.9, 50.1, 50.8);
   *
   * // Round to whole pixels
   * bounds.ceil();
   * // bounds are now (10, 10, 51, 51)
   * ```
   * @returns This bounds object for chaining
   * @see {@link Bounds#scale} For size adjustments
   * @see {@link Bounds#fit} For constraining bounds
   */ ceil() {
        this.minX = Math.floor(this.minX);
        this.minY = Math.floor(this.minY);
        this.maxX = Math.ceil(this.maxX);
        this.maxY = Math.ceil(this.maxY);
        return this;
    }
    /**
   * Creates a new Bounds instance with the same values.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   *
   * // Create a copy
   * const copy = bounds.clone();
   *
   * // Original and copy are independent
   * bounds.pad(10);
   * console.log(copy.width === bounds.width); // false
   * ```
   * @returns A new Bounds instance with the same values
   * @see {@link Bounds#copyFrom} For reusing existing bounds
   */ clone() {
        return new Bounds(this.minX, this.minY, this.maxX, this.maxY);
    }
    /**
   * Scales the bounds by the given values, adjusting all edges proportionally.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   *
   * // Scale uniformly
   * bounds.scale(2);
   * // bounds are now (0, 0, 200, 200)
   *
   * // Scale non-uniformly
   * bounds.scale(0.5, 2);
   * // bounds are now (0, 0, 100, 400)
   * ```
   * @param x - The X value to scale by
   * @param y - The Y value to scale by (defaults to x)
   * @returns This bounds object for chaining
   * @see {@link Bounds#pad} For adding padding
   * @see {@link Bounds#fit} For constraining size
   */ scale(x) {
        let y = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : x;
        this.minX *= x;
        this.minY *= y;
        this.maxX *= x;
        this.maxY *= y;
        return this;
    }
    /**
   * The x position of the bounds in local space.
   * Setting this value will move the bounds while maintaining its width.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Get x position
   * console.log(bounds.x); // 0
   *
   * // Move bounds horizontally
   * bounds.x = 50;
   * console.log(bounds.minX, bounds.maxX); // 50, 150
   *
   * // Width stays the same
   * console.log(bounds.width); // Still 100
   * ```
   */ get x() {
        return this.minX;
    }
    set x(value) {
        const width = this.maxX - this.minX;
        this.minX = value;
        this.maxX = value + width;
    }
    /**
   * The y position of the bounds in local space.
   * Setting this value will move the bounds while maintaining its height.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Get y position
   * console.log(bounds.y); // 0
   *
   * // Move bounds vertically
   * bounds.y = 50;
   * console.log(bounds.minY, bounds.maxY); // 50, 150
   *
   * // Height stays the same
   * console.log(bounds.height); // Still 100
   * ```
   */ get y() {
        return this.minY;
    }
    set y(value) {
        const height = this.maxY - this.minY;
        this.minY = value;
        this.maxY = value + height;
    }
    /**
   * The width value of the bounds.
   * Represents the distance between minX and maxX coordinates.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Get width
   * console.log(bounds.width); // 100
   * // Resize width
   * bounds.width = 200;
   * console.log(bounds.maxX - bounds.minX); // 200
   * ```
   */ get width() {
        return this.maxX - this.minX;
    }
    set width(value) {
        this.maxX = this.minX + value;
    }
    /**
   * The height value of the bounds.
   * Represents the distance between minY and maxY coordinates.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Get height
   * console.log(bounds.height); // 100
   * // Resize height
   * bounds.height = 150;
   * console.log(bounds.maxY - bounds.minY); // 150
   * ```
   */ get height() {
        return this.maxY - this.minY;
    }
    set height(value) {
        this.maxY = this.minY + value;
    }
    /**
   * The left edge coordinate of the bounds.
   * Alias for minX.
   * @example
   * ```ts
   * const bounds = new Bounds(50, 0, 150, 100);
   * console.log(bounds.left); // 50
   * console.log(bounds.left === bounds.minX); // true
   * ```
   * @readonly
   */ get left() {
        return this.minX;
    }
    /**
   * The right edge coordinate of the bounds.
   * Alias for maxX.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * console.log(bounds.right); // 100
   * console.log(bounds.right === bounds.maxX); // true
   * ```
   * @readonly
   */ get right() {
        return this.maxX;
    }
    /**
   * The top edge coordinate of the bounds.
   * Alias for minY.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 25, 100, 125);
   * console.log(bounds.top); // 25
   * console.log(bounds.top === bounds.minY); // true
   * ```
   * @readonly
   */ get top() {
        return this.minY;
    }
    /**
   * The bottom edge coordinate of the bounds.
   * Alias for maxY.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 200);
   * console.log(bounds.bottom); // 200
   * console.log(bounds.bottom === bounds.maxY); // true
   * ```
   * @readonly
   */ get bottom() {
        return this.maxY;
    }
    /**
   * Whether the bounds has positive width and height.
   * Checks if both dimensions are greater than zero.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Check if bounds are positive
   * console.log(bounds.isPositive); // true
   *
   * // Negative bounds
   * bounds.maxX = bounds.minX;
   * console.log(bounds.isPositive); // false, width is 0
   * ```
   * @readonly
   * @see {@link Bounds#isEmpty} For checking empty state
   * @see {@link Bounds#isValid} For checking validity
   */ get isPositive() {
        return this.maxX - this.minX > 0 && this.maxY - this.minY > 0;
    }
    /**
   * Whether the bounds has valid coordinates.
   * Checks if the bounds has been initialized with real values.
   * @example
   * ```ts
   * const bounds = new Bounds();
   * console.log(bounds.isValid); // false, default state
   *
   * // Set valid bounds
   * bounds.addFrame(0, 0, 100, 100);
   * console.log(bounds.isValid); // true
   * ```
   * @readonly
   * @see {@link Bounds#isEmpty} For checking empty state
   * @see {@link Bounds#isPositive} For checking dimensions
   */ get isValid() {
        return this.minX + this.minY !== Infinity;
    }
    /**
   * Adds vertices from a Float32Array to the bounds, optionally transformed by a matrix.
   * Used for efficiently updating bounds from raw vertex data.
   * @example
   * ```ts
   * const bounds = new Bounds();
   *
   * // Add vertices from geometry
   * const vertices = new Float32Array([
   *     0, 0,    // Vertex 1
   *     100, 0,  // Vertex 2
   *     100, 100 // Vertex 3
   * ]);
   * bounds.addVertexData(vertices, 0, 6);
   *
   * // Add transformed vertices
   * const matrix = new Matrix()
   *     .translate(50, 50)
   *     .rotate(Math.PI / 4);
   * bounds.addVertexData(vertices, 0, 6, matrix);
   *
   * // Add subset of vertices
   * bounds.addVertexData(vertices, 2, 4); // Only second vertex
   * ```
   * @param vertexData - The array of vertices to add
   * @param beginOffset - Starting index in the vertex array
   * @param endOffset - Ending index in the vertex array (excluded)
   * @param matrix - Optional transformation matrix
   * @see {@link Bounds#addFrame} For adding rectangular frames
   * @see {@link Matrix} For transformation details
   */ addVertexData(vertexData, beginOffset, endOffset, matrix) {
        let minX = this.minX;
        let minY = this.minY;
        let maxX = this.maxX;
        let maxY = this.maxY;
        matrix || (matrix = this.matrix);
        const a = matrix.a;
        const b = matrix.b;
        const c = matrix.c;
        const d = matrix.d;
        const tx = matrix.tx;
        const ty = matrix.ty;
        for(let i = beginOffset; i < endOffset; i += 2){
            const localX = vertexData[i];
            const localY = vertexData[i + 1];
            const x = a * localX + c * localY + tx;
            const y = b * localX + d * localY + ty;
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
        }
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }
    /**
   * Checks if a point is contained within the bounds.
   * Returns true if the point's coordinates fall within the bounds' area.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * // Basic point check
   * console.log(bounds.containsPoint(50, 50)); // true
   * console.log(bounds.containsPoint(150, 150)); // false
   *
   * // Check edges
   * console.log(bounds.containsPoint(0, 0));   // true, includes edges
   * console.log(bounds.containsPoint(100, 100)); // true, includes edges
   * ```
   * @param x - x coordinate to check
   * @param y - y coordinate to check
   * @returns True if the point is inside the bounds
   * @see {@link Bounds#isPositive} For valid bounds check
   * @see {@link Bounds#rectangle} For Rectangle representation
   */ containsPoint(x, y) {
        if (this.minX <= x && this.minY <= y && this.maxX >= x && this.maxY >= y) {
            return true;
        }
        return false;
    }
    /**
   * Returns a string representation of the bounds.
   * Useful for debugging and logging bounds information.
   * @example
   * ```ts
   * const bounds = new Bounds(0, 0, 100, 100);
   * console.log(bounds.toString()); // "[pixi.js:Bounds minX=0 minY=0 maxX=100 maxY=100 width=100 height=100]"
   * ```
   * @returns A string describing the bounds
   * @see {@link Bounds#copyFrom} For copying bounds
   * @see {@link Bounds#clone} For creating a new instance
   */ toString() {
        return "[pixi.js:Bounds minX=".concat(this.minX, " minY=").concat(this.minY, " maxX=").concat(this.maxX, " maxY=").concat(this.maxY, " width=").concat(this.width, " height=").concat(this.height, "]");
    }
    /**
   * Copies the bounds from another bounds object.
   * Useful for reusing bounds objects and avoiding allocations.
   * @example
   * ```ts
   * const sourceBounds = new Bounds(0, 0, 100, 100);
   * // Copy bounds
   * const targetBounds = new Bounds();
   * targetBounds.copyFrom(sourceBounds);
   * ```
   * @param bounds - The bounds to copy from
   * @returns This bounds object for chaining
   * @see {@link Bounds#clone} For creating new instances
   */ copyFrom(bounds) {
        this.minX = bounds.minX;
        this.minY = bounds.minY;
        this.maxX = bounds.maxX;
        this.maxY = bounds.maxY;
        return this;
    }
    /**
   * Creates a new Bounds object.
   * @param minX - The minimum X coordinate of the bounds.
   * @param minY - The minimum Y coordinate of the bounds.
   * @param maxX - The maximum X coordinate of the bounds.
   * @param maxY - The maximum Y coordinate of the bounds.
   */ constructor(minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity){
        /**
     * The minimum X coordinate of the bounds.
     * Represents the leftmost edge of the bounding box.
     * @example
     * ```ts
     * const bounds = new Bounds();
     * // Set left edge
     * bounds.minX = 100;
     * ```
     * @default Infinity
     */ this.minX = Infinity;
        /**
     * The minimum Y coordinate of the bounds.
     * Represents the topmost edge of the bounding box.
     * @example
     * ```ts
     * const bounds = new Bounds();
     * // Set top edge
     * bounds.minY = 100;
     * ```
     * @default Infinity
     */ this.minY = Infinity;
        /**
     * The maximum X coordinate of the bounds.
     * Represents the rightmost edge of the bounding box.
     * @example
     * ```ts
     * const bounds = new Bounds();
     * // Set right edge
     * bounds.maxX = 200;
     * // Get width
     * const width = bounds.maxX - bounds.minX;
     * ```
     * @default -Infinity
     */ this.maxX = -Infinity;
        /**
     * The maximum Y coordinate of the bounds.
     * Represents the bottommost edge of the bounding box.
     * @example
     * ```ts
     * const bounds = new Bounds();
     * // Set bottom edge
     * bounds.maxY = 200;
     * // Get height
     * const height = bounds.maxY - bounds.minY;
     * ```
     * @default -Infinity
     */ this.maxY = -Infinity;
        /**
     * The transformation matrix applied to this bounds object.
     * Used when calculating bounds with transforms.
     * @example
     * ```ts
     * const bounds = new Bounds();
     *
     * // Apply translation matrix
     * bounds.matrix = new Matrix()
     *     .translate(100, 100);
     *
     * // Combine transformations
     * bounds.matrix = new Matrix()
     *     .translate(50, 50)
     *     .rotate(Math.PI / 4)
     *     .scale(2, 2);
     *
     * // Use in bounds calculations
     * bounds.addFrame(0, 0, 100, 100); // Uses current matrix
     * bounds.addFrame(0, 0, 100, 100, customMatrix); // Override matrix
     * ```
     * @advanced
     */ this.matrix = defaultMatrix;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }
}
;
 //# sourceMappingURL=Bounds.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/cacheAsTextureMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cacheAsTextureMixin",
    ()=>cacheAsTextureMixin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
;
"use strict";
const cacheAsTextureMixin = {
    get isCachedAsTexture () {
        var _this_renderGroup;
        return !!((_this_renderGroup = this.renderGroup) === null || _this_renderGroup === void 0 ? void 0 : _this_renderGroup.isCachedAsTexture);
    },
    cacheAsTexture (val1) {
        if (typeof val1 === "boolean" && val1 === false) {
            this.disableRenderGroup();
        } else {
            this.enableRenderGroup();
            this.renderGroup.enableCacheAsTexture(val1 === true ? {} : val1);
        }
    },
    updateCacheTexture () {
        var _this_renderGroup;
        (_this_renderGroup = this.renderGroup) === null || _this_renderGroup === void 0 ? void 0 : _this_renderGroup.updateCacheTexture();
    },
    get cacheAsBitmap () {
        return this.isCachedAsTexture;
    },
    set cacheAsBitmap (val){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])("v8.6.0", "cacheAsBitmap is deprecated, use cacheAsTexture instead.");
        this.cacheAsTexture(val);
    }
};
;
 //# sourceMappingURL=cacheAsTextureMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "childrenHelperMixin",
    ()=>childrenHelperMixin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$removeItems$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/removeItems.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
;
;
"use strict";
const childrenHelperMixin = {
    allowChildren: true,
    removeChildren () {
        let beginIndex = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0, endIndex = arguments.length > 1 ? arguments[1] : void 0;
        const end = endIndex !== null && endIndex !== void 0 ? endIndex : this.children.length;
        const range = end - beginIndex;
        const removed = [];
        if (range > 0 && range <= end) {
            for(let i = end - 1; i >= beginIndex; i--){
                const child = this.children[i];
                if (!child) continue;
                removed.push(child);
                child.parent = null;
            }
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$removeItems$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeItems"])(this.children, beginIndex, end);
            const renderGroup = this.renderGroup || this.parentRenderGroup;
            if (renderGroup) {
                renderGroup.removeChildren(removed);
            }
            for(let i = 0; i < removed.length; ++i){
                var _child_parentRenderLayer;
                const child = removed[i];
                (_child_parentRenderLayer = child.parentRenderLayer) === null || _child_parentRenderLayer === void 0 ? void 0 : _child_parentRenderLayer.detach(child);
                this.emit("childRemoved", child, this, i);
                removed[i].emit("removed", this);
            }
            if (removed.length > 0) {
                this._didViewChangeTick++;
            }
            return removed;
        } else if (range === 0 && this.children.length === 0) {
            return removed;
        }
        throw new RangeError("removeChildren: numeric values are outside the acceptable range.");
    },
    removeChildAt (index) {
        const child = this.getChildAt(index);
        return this.removeChild(child);
    },
    getChildAt (index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error("getChildAt: Index (".concat(index, ") does not exist."));
        }
        return this.children[index];
    },
    setChildIndex (child, index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error("The index ".concat(index, " supplied is out of bounds ").concat(this.children.length));
        }
        this.getChildIndex(child);
        this.addChildAt(child, index);
    },
    getChildIndex (child) {
        const index = this.children.indexOf(child);
        if (index === -1) {
            throw new Error("The supplied Container must be a child of the caller");
        }
        return index;
    },
    addChildAt (child, index) {
        if (!this.allowChildren) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "addChildAt: Only Containers will be allowed to add children in v8.0.0");
        }
        const { children } = this;
        if (index < 0 || index > children.length) {
            throw new Error("".concat(child, "addChildAt: The index ").concat(index, " supplied is out of bounds ").concat(children.length));
        }
        if (child.parent) {
            const currentIndex = child.parent.children.indexOf(child);
            if (child.parent === this && currentIndex === index) {
                return child;
            }
            if (currentIndex !== -1) {
                child.parent.children.splice(currentIndex, 1);
            }
        }
        if (index === children.length) {
            children.push(child);
        } else {
            children.splice(index, 0, child);
        }
        child.parent = this;
        child.didChange = true;
        child._updateFlags = 15;
        const renderGroup = this.renderGroup || this.parentRenderGroup;
        if (renderGroup) {
            renderGroup.addChild(child);
        }
        if (this.sortableChildren) this.sortDirty = true;
        this.emit("childAdded", child, this, index);
        child.emit("added", this);
        return child;
    },
    swapChildren (child, child2) {
        if (child === child2) {
            return;
        }
        const index1 = this.getChildIndex(child);
        const index2 = this.getChildIndex(child2);
        this.children[index1] = child2;
        this.children[index2] = child;
        const renderGroup = this.renderGroup || this.parentRenderGroup;
        if (renderGroup) {
            renderGroup.structureDidChange = true;
        }
        this._didContainerChangeTick++;
    },
    removeFromParent () {
        var _this_parent;
        (_this_parent = this.parent) === null || _this_parent === void 0 ? void 0 : _this_parent.removeChild(this);
    },
    reparentChild () {
        for(var _len = arguments.length, child = new Array(_len), _key = 0; _key < _len; _key++){
            child[_key] = arguments[_key];
        }
        if (child.length === 1) {
            return this.reparentChildAt(child[0], this.children.length);
        }
        child.forEach((c)=>this.reparentChildAt(c, this.children.length));
        return child[0];
    },
    reparentChildAt (child, index) {
        if (child.parent === this) {
            this.setChildIndex(child, index);
            return child;
        }
        const childMat = child.worldTransform.clone();
        child.removeFromParent();
        this.addChildAt(child, index);
        const newMatrix = this.worldTransform.clone();
        newMatrix.invert();
        childMat.prepend(newMatrix);
        child.setFromMatrix(childMat);
        return child;
    },
    replaceChild (oldChild, newChild) {
        oldChild.updateLocalTransform();
        this.addChildAt(newChild, this.getChildIndex(oldChild));
        newChild.setFromMatrix(oldChild.localTransform);
        newChild.updateLocalTransform();
        this.removeChild(oldChild);
    }
};
;
 //# sourceMappingURL=childrenHelperMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/collectRenderablesMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "collectRenderablesMixin",
    ()=>collectRenderablesMixin
]);
"use strict";
const collectRenderablesMixin = {
    collectRenderables (instructionSet, renderer, currentLayer) {
        if (this.parentRenderLayer && this.parentRenderLayer !== currentLayer || this.globalDisplayStatus < 7 || !this.includeInBuild) return;
        if (this.sortableChildren) {
            this.sortChildren();
        }
        if (this.isSimple) {
            this.collectRenderablesSimple(instructionSet, renderer, currentLayer);
        } else if (this.renderGroup) {
            renderer.renderPipes.renderGroup.addRenderGroup(this.renderGroup, instructionSet);
        } else {
            this.collectRenderablesWithEffects(instructionSet, renderer, currentLayer);
        }
    },
    collectRenderablesSimple (instructionSet, renderer, currentLayer) {
        const children = this.children;
        const length = children.length;
        for(let i = 0; i < length; i++){
            children[i].collectRenderables(instructionSet, renderer, currentLayer);
        }
    },
    collectRenderablesWithEffects (instructionSet, renderer, currentLayer) {
        const { renderPipes } = renderer;
        for(let i = 0; i < this.effects.length; i++){
            const effect = this.effects[i];
            const pipe = renderPipes[effect.pipe];
            pipe.push(effect, this, instructionSet);
        }
        this.collectRenderablesSimple(instructionSet, renderer, currentLayer);
        for(let i = this.effects.length - 1; i >= 0; i--){
            const effect = this.effects[i];
            const pipe = renderPipes[effect.pipe];
            pipe.pop(effect, this, instructionSet);
        }
    }
};
;
 //# sourceMappingURL=collectRenderablesMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/effectsMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "effectsMixin",
    ()=>effectsMixin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterEffect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/FilterEffect.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$MaskEffectManager$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/MaskEffectManager.mjs [app-client] (ecmascript)");
;
;
"use strict";
const effectsMixin = {
    _maskEffect: null,
    _maskOptions: {
        inverse: false
    },
    _filterEffect: null,
    effects: [],
    _markStructureAsChanged () {
        const renderGroup = this.renderGroup || this.parentRenderGroup;
        if (renderGroup) {
            renderGroup.structureDidChange = true;
        }
    },
    addEffect (effect) {
        const index = this.effects.indexOf(effect);
        if (index !== -1) return;
        this.effects.push(effect);
        this.effects.sort((a, b)=>a.priority - b.priority);
        this._markStructureAsChanged();
        this._updateIsSimple();
    },
    removeEffect (effect) {
        const index = this.effects.indexOf(effect);
        if (index === -1) return;
        this.effects.splice(index, 1);
        this._markStructureAsChanged();
        this._updateIsSimple();
    },
    set mask (value){
        const effect = this._maskEffect;
        if ((effect === null || effect === void 0 ? void 0 : effect.mask) === value) return;
        if (effect) {
            this.removeEffect(effect);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$MaskEffectManager$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MaskEffectManager"].returnMaskEffect(effect);
            this._maskEffect = null;
        }
        if (value === null || value === void 0) return;
        this._maskEffect = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$MaskEffectManager$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MaskEffectManager"].getMaskEffect(value);
        this.addEffect(this._maskEffect);
    },
    get mask () {
        var _this__maskEffect;
        return (_this__maskEffect = this._maskEffect) === null || _this__maskEffect === void 0 ? void 0 : _this__maskEffect.mask;
    },
    setMask (options) {
        this._maskOptions = {
            ...this._maskOptions,
            ...options
        };
        if (options.mask) {
            this.mask = options.mask;
        }
        this._markStructureAsChanged();
    },
    set filters (value){
        var _effect_filters;
        if (!Array.isArray(value) && value) value = [
            value
        ];
        const effect = this._filterEffect || (this._filterEffect = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterEffect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FilterEffect"]());
        value = value;
        const hasFilters = (value === null || value === void 0 ? void 0 : value.length) > 0;
        const hadFilters = ((_effect_filters = effect.filters) === null || _effect_filters === void 0 ? void 0 : _effect_filters.length) > 0;
        const didChange = hasFilters !== hadFilters;
        value = Array.isArray(value) ? value.slice(0) : value;
        effect.filters = Object.freeze(value);
        if (didChange) {
            if (hasFilters) {
                this.addEffect(effect);
            } else {
                this.removeEffect(effect);
                effect.filters = value !== null && value !== void 0 ? value : null;
            }
        }
    },
    get filters () {
        var _this__filterEffect;
        return (_this__filterEffect = this._filterEffect) === null || _this__filterEffect === void 0 ? void 0 : _this__filterEffect.filters;
    },
    set filterArea (value){
        this._filterEffect || (this._filterEffect = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterEffect$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FilterEffect"]());
        this._filterEffect.filterArea = value;
    },
    get filterArea () {
        var _this__filterEffect1;
        return (_this__filterEffect1 = this._filterEffect) === null || _this__filterEffect1 === void 0 ? void 0 : _this__filterEffect1.filterArea;
    }
};
;
 //# sourceMappingURL=effectsMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/findMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "findMixin",
    ()=>findMixin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
;
"use strict";
const findMixin = {
    label: null,
    get name () {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "Container.name property has been removed, use Container.label instead");
        return this.label;
    },
    set name (value){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "Container.name property has been removed, use Container.label instead");
        this.label = value;
    },
    getChildByName (name) {
        let deep = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        return this.getChildByLabel(name, deep);
    },
    getChildByLabel (label) {
        let deep = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        const children = this.children;
        for(let i = 0; i < children.length; i++){
            const child = children[i];
            if (child.label === label || label instanceof RegExp && label.test(child.label)) return child;
        }
        if (deep) {
            for(let i = 0; i < children.length; i++){
                const child = children[i];
                const found = child.getChildByLabel(label, true);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    },
    getChildrenByLabel (label) {
        let deep = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false, out = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [];
        const children = this.children;
        for(let i = 0; i < children.length; i++){
            const child = children[i];
            if (child.label === label || label instanceof RegExp && label.test(child.label)) {
                out.push(child);
            }
        }
        if (deep) {
            for(let i = 0; i < children.length; i++){
                children[i].getChildrenByLabel(label, true, out);
            }
        }
        return out;
    }
};
;
 //# sourceMappingURL=findMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/utils/matrixAndBoundsPool.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "boundsPool",
    ()=>boundsPool,
    "matrixPool",
    ()=>matrixPool
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
const matrixPool = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BigPool"].getPool(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]);
const boundsPool = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BigPool"].getPool(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Bounds"]);
;
 //# sourceMappingURL=matrixAndBoundsPool.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/getFastGlobalBoundsMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getFastGlobalBoundsMixin",
    ()=>getFastGlobalBoundsMixin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/utils/matrixAndBoundsPool.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
const tempMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
const getFastGlobalBoundsMixin = {
    getFastGlobalBounds (factorRenderLayers, bounds) {
        bounds || (bounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Bounds"]());
        bounds.clear();
        this._getGlobalBoundsRecursive(!!factorRenderLayers, bounds, this.parentRenderLayer);
        if (!bounds.isValid) {
            bounds.set(0, 0, 0, 0);
        }
        const renderGroup = this.renderGroup || this.parentRenderGroup;
        bounds.applyMatrix(renderGroup.worldTransform);
        return bounds;
    },
    _getGlobalBoundsRecursive (factorRenderLayers, bounds, currentLayer) {
        let localBounds = bounds;
        if (factorRenderLayers && this.parentRenderLayer && this.parentRenderLayer !== currentLayer) return;
        if (this.localDisplayStatus !== 7 || !this.measurable) {
            return;
        }
        const manageEffects = !!this.effects.length;
        if (this.renderGroup || manageEffects) {
            localBounds = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["boundsPool"].get().clear();
        }
        if (this.boundsArea) {
            bounds.addRect(this.boundsArea, this.worldTransform);
        } else {
            if (this.renderPipeId) {
                const viewBounds = this.bounds;
                localBounds.addFrame(viewBounds.minX, viewBounds.minY, viewBounds.maxX, viewBounds.maxY, this.groupTransform);
            }
            const children = this.children;
            for(let i = 0; i < children.length; i++){
                children[i]._getGlobalBoundsRecursive(factorRenderLayers, localBounds, currentLayer);
            }
        }
        if (manageEffects) {
            let advanced = false;
            const renderGroup = this.renderGroup || this.parentRenderGroup;
            for(let i = 0; i < this.effects.length; i++){
                if (this.effects[i].addBounds) {
                    if (!advanced) {
                        advanced = true;
                        localBounds.applyMatrix(renderGroup.worldTransform);
                    }
                    this.effects[i].addBounds(localBounds, true);
                }
            }
            if (advanced) {
                localBounds.applyMatrix(renderGroup.worldTransform.copyTo(tempMatrix).invert());
            }
            bounds.addBounds(localBounds);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["boundsPool"].return(localBounds);
        } else if (this.renderGroup) {
            bounds.addBounds(localBounds, this.relativeGroupTransform);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["boundsPool"].return(localBounds);
        }
    }
};
;
 //# sourceMappingURL=getFastGlobalBoundsMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getGlobalBounds.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getGlobalBounds",
    ()=>getGlobalBounds,
    "updateTransformBackwards",
    ()=>updateTransformBackwards
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/utils/matrixAndBoundsPool.mjs [app-client] (ecmascript)");
;
;
"use strict";
function getGlobalBounds(target, skipUpdateTransform, bounds) {
    bounds.clear();
    let parentTransform;
    let pooledMatrix;
    if (target.parent) {
        if (!skipUpdateTransform) {
            pooledMatrix = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].get().identity();
            parentTransform = updateTransformBackwards(target, pooledMatrix);
        } else {
            parentTransform = target.parent.worldTransform;
        }
    } else {
        parentTransform = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"].IDENTITY;
    }
    _getGlobalBounds(target, bounds, parentTransform, skipUpdateTransform);
    if (pooledMatrix) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].return(pooledMatrix);
    }
    if (!bounds.isValid) {
        bounds.set(0, 0, 0, 0);
    }
    return bounds;
}
function _getGlobalBounds(target, bounds, parentTransform, skipUpdateTransform) {
    if (!target.visible || !target.measurable) return;
    let worldTransform;
    if (!skipUpdateTransform) {
        target.updateLocalTransform();
        worldTransform = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].get();
        worldTransform.appendFrom(target.localTransform, parentTransform);
    } else {
        worldTransform = target.worldTransform;
    }
    const parentBounds = bounds;
    const preserveBounds = !!target.effects.length;
    if (preserveBounds) {
        bounds = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["boundsPool"].get().clear();
    }
    if (target.boundsArea) {
        bounds.addRect(target.boundsArea, worldTransform);
    } else {
        const renderableBounds = target.bounds;
        if (renderableBounds && !renderableBounds.isEmpty()) {
            bounds.matrix = worldTransform;
            bounds.addBounds(renderableBounds);
        }
        for(let i = 0; i < target.children.length; i++){
            _getGlobalBounds(target.children[i], bounds, worldTransform, skipUpdateTransform);
        }
    }
    if (preserveBounds) {
        for(let i = 0; i < target.effects.length; i++){
            var _target_effects_i_addBounds, _target_effects_i;
            (_target_effects_i_addBounds = (_target_effects_i = target.effects[i]).addBounds) === null || _target_effects_i_addBounds === void 0 ? void 0 : _target_effects_i_addBounds.call(_target_effects_i, bounds);
        }
        parentBounds.addBounds(bounds, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"].IDENTITY);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["boundsPool"].return(bounds);
    }
    if (!skipUpdateTransform) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].return(worldTransform);
    }
}
function updateTransformBackwards(target, parentTransform) {
    const parent = target.parent;
    if (parent) {
        updateTransformBackwards(parent, parentTransform);
        parent.updateLocalTransform();
        parentTransform.append(parent.localTransform);
    }
    return parentTransform;
}
;
 //# sourceMappingURL=getGlobalBounds.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/multiplyHexColors.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "multiplyHexColors",
    ()=>multiplyHexColors
]);
"use strict";
function multiplyHexColors(color1, color2) {
    if (color1 === 16777215 || !color2) return color2;
    if (color2 === 16777215 || !color1) return color1;
    const r1 = color1 >> 16 & 255;
    const g1 = color1 >> 8 & 255;
    const b1 = color1 & 255;
    const r2 = color2 >> 16 & 255;
    const g2 = color2 >> 8 & 255;
    const b2 = color2 & 255;
    const r = r1 * r2 / 255 | 0;
    const g = g1 * g2 / 255 | 0;
    const b = b1 * b2 / 255 | 0;
    return (r << 16) + (g << 8) + b;
}
;
 //# sourceMappingURL=multiplyHexColors.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/multiplyColors.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "multiplyColors",
    ()=>multiplyColors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyHexColors$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/multiplyHexColors.mjs [app-client] (ecmascript)");
;
"use strict";
const WHITE_BGR = 16777215;
function multiplyColors(localBGRColor, parentBGRColor) {
    if (localBGRColor === WHITE_BGR) {
        return parentBGRColor;
    }
    if (parentBGRColor === WHITE_BGR) {
        return localBGRColor;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyHexColors$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["multiplyHexColors"])(localBGRColor, parentBGRColor);
}
;
 //# sourceMappingURL=multiplyColors.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/getGlobalMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bgr2rgb",
    ()=>bgr2rgb,
    "getGlobalMixin",
    ()=>getGlobalMixin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getGlobalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getGlobalBounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/utils/matrixAndBoundsPool.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyColors$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/multiplyColors.mjs [app-client] (ecmascript)");
;
;
;
;
"use strict";
function bgr2rgb(color) {
    return ((color & 255) << 16) + (color & 65280) + (color >> 16 & 255);
}
const getGlobalMixin = {
    getGlobalAlpha (skipUpdate) {
        if (skipUpdate) {
            if (this.renderGroup) {
                return this.renderGroup.worldAlpha;
            }
            if (this.parentRenderGroup) {
                return this.parentRenderGroup.worldAlpha * this.alpha;
            }
            return this.alpha;
        }
        let alpha = this.alpha;
        let current = this.parent;
        while(current){
            alpha *= current.alpha;
            current = current.parent;
        }
        return alpha;
    },
    getGlobalTransform () {
        let matrix = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"](), skipUpdate = arguments.length > 1 ? arguments[1] : void 0;
        if (skipUpdate) {
            return matrix.copyFrom(this.worldTransform);
        }
        this.updateLocalTransform();
        const parentTransform = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getGlobalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateTransformBackwards"])(this, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].get().identity());
        matrix.appendFrom(this.localTransform, parentTransform);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].return(parentTransform);
        return matrix;
    },
    getGlobalTint (skipUpdate) {
        if (skipUpdate) {
            if (this.renderGroup) {
                return bgr2rgb(this.renderGroup.worldColor);
            }
            if (this.parentRenderGroup) {
                return bgr2rgb((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyColors$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["multiplyColors"])(this.localColor, this.parentRenderGroup.worldColor));
            }
            return this.tint;
        }
        let color = this.localColor;
        let parent = this.parent;
        while(parent){
            color = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyColors$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["multiplyColors"])(color, parent.localColor);
            parent = parent.parent;
        }
        return bgr2rgb(color);
    }
};
;
 //# sourceMappingURL=getGlobalMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getLocalBounds.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getLocalBounds",
    ()=>getLocalBounds
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/utils/matrixAndBoundsPool.mjs [app-client] (ecmascript)");
;
;
"use strict";
function getLocalBounds(target, bounds, relativeMatrix) {
    bounds.clear();
    relativeMatrix || (relativeMatrix = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"].IDENTITY);
    _getLocalBounds(target, bounds, relativeMatrix, target, true);
    if (!bounds.isValid) {
        bounds.set(0, 0, 0, 0);
    }
    return bounds;
}
function _getLocalBounds(target, bounds, parentTransform, rootContainer, isRoot) {
    let relativeTransform;
    if (!isRoot) {
        if (!target.visible || !target.measurable) return;
        target.updateLocalTransform();
        const localTransform = target.localTransform;
        relativeTransform = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].get();
        relativeTransform.appendFrom(localTransform, parentTransform);
    } else {
        relativeTransform = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].get();
        relativeTransform = parentTransform.copyTo(relativeTransform);
    }
    const parentBounds = bounds;
    const preserveBounds = !!target.effects.length;
    if (preserveBounds) {
        bounds = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["boundsPool"].get().clear();
    }
    if (target.boundsArea) {
        bounds.addRect(target.boundsArea, relativeTransform);
    } else {
        if (target.renderPipeId) {
            bounds.matrix = relativeTransform;
            bounds.addBounds(target.bounds);
        }
        const children = target.children;
        for(let i = 0; i < children.length; i++){
            _getLocalBounds(children[i], bounds, relativeTransform, rootContainer, false);
        }
    }
    if (preserveBounds) {
        for(let i = 0; i < target.effects.length; i++){
            var _target_effects_i_addLocalBounds, _target_effects_i;
            (_target_effects_i_addLocalBounds = (_target_effects_i = target.effects[i]).addLocalBounds) === null || _target_effects_i_addLocalBounds === void 0 ? void 0 : _target_effects_i_addLocalBounds.call(_target_effects_i, bounds, rootContainer);
        }
        parentBounds.addBounds(bounds, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"].IDENTITY);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["boundsPool"].return(bounds);
    }
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].return(relativeTransform);
}
;
 //# sourceMappingURL=getLocalBounds.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/checkChildrenDidChange.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkChildrenDidChange",
    ()=>checkChildrenDidChange
]);
"use strict";
function checkChildrenDidChange(container, previousData) {
    const children = container.children;
    for(let i = 0; i < children.length; i++){
        const child = children[i];
        const uid = child.uid;
        const didChange = (child._didViewChangeTick & 65535) << 16 | child._didContainerChangeTick & 65535;
        const index = previousData.index;
        if (previousData.data[index] !== uid || previousData.data[index + 1] !== didChange) {
            previousData.data[previousData.index] = uid;
            previousData.data[previousData.index + 1] = didChange;
            previousData.didChange = true;
        }
        previousData.index = index + 2;
        if (child.children.length) {
            checkChildrenDidChange(child, previousData);
        }
    }
    return previousData.didChange;
}
;
 //# sourceMappingURL=checkChildrenDidChange.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/measureMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "measureMixin",
    ()=>measureMixin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getGlobalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getGlobalBounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getLocalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getLocalBounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$checkChildrenDidChange$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/checkChildrenDidChange.mjs [app-client] (ecmascript)");
;
;
;
;
;
"use strict";
const tempMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
const measureMixin = {
    _localBoundsCacheId: -1,
    _localBoundsCacheData: null,
    _setWidth (value, localWidth) {
        const sign = Math.sign(this.scale.x) || 1;
        if (localWidth !== 0) {
            this.scale.x = value / localWidth * sign;
        } else {
            this.scale.x = sign;
        }
    },
    _setHeight (value, localHeight) {
        const sign = Math.sign(this.scale.y) || 1;
        if (localHeight !== 0) {
            this.scale.y = value / localHeight * sign;
        } else {
            this.scale.y = sign;
        }
    },
    getLocalBounds () {
        if (!this._localBoundsCacheData) {
            this._localBoundsCacheData = {
                data: [],
                index: 1,
                didChange: false,
                localBounds: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Bounds"]()
            };
        }
        const localBoundsCacheData = this._localBoundsCacheData;
        localBoundsCacheData.index = 1;
        localBoundsCacheData.didChange = false;
        if (localBoundsCacheData.data[0] !== this._didViewChangeTick) {
            localBoundsCacheData.didChange = true;
            localBoundsCacheData.data[0] = this._didViewChangeTick;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$checkChildrenDidChange$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["checkChildrenDidChange"])(this, localBoundsCacheData);
        if (localBoundsCacheData.didChange) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getLocalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getLocalBounds"])(this, localBoundsCacheData.localBounds, tempMatrix);
        }
        return localBoundsCacheData.localBounds;
    },
    getBounds (skipUpdate, bounds) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getGlobalBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGlobalBounds"])(this, skipUpdate, bounds || new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Bounds"]());
    }
};
;
 //# sourceMappingURL=measureMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/onRenderMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "onRenderMixin",
    ()=>onRenderMixin
]);
"use strict";
const onRenderMixin = {
    _onRender: null,
    set onRender (func){
        const renderGroup = this.renderGroup || this.parentRenderGroup;
        if (!func) {
            if (this._onRender) {
                renderGroup === null || renderGroup === void 0 ? void 0 : renderGroup.removeOnRender(this);
            }
            this._onRender = null;
            return;
        }
        if (!this._onRender) {
            renderGroup === null || renderGroup === void 0 ? void 0 : renderGroup.addOnRender(this);
        }
        this._onRender = func;
    },
    get onRender () {
        return this._onRender;
    }
};
;
 //# sourceMappingURL=onRenderMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/sortMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sortMixin",
    ()=>sortMixin
]);
"use strict";
const sortMixin = {
    _zIndex: 0,
    sortDirty: false,
    sortableChildren: false,
    get zIndex () {
        return this._zIndex;
    },
    set zIndex (value){
        if (this._zIndex === value) return;
        this._zIndex = value;
        this.depthOfChildModified();
    },
    depthOfChildModified () {
        if (this.parent) {
            this.parent.sortableChildren = true;
            this.parent.sortDirty = true;
        }
        if (this.parentRenderGroup) {
            this.parentRenderGroup.structureDidChange = true;
        }
    },
    sortChildren () {
        if (!this.sortDirty) return;
        this.sortDirty = false;
        this.children.sort(sortChildren);
    }
};
function sortChildren(a, b) {
    return a._zIndex - b._zIndex;
}
;
 //# sourceMappingURL=sortMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/toLocalGlobalMixin.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toLocalGlobalMixin",
    ()=>toLocalGlobalMixin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/Point.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/utils/matrixAndBoundsPool.mjs [app-client] (ecmascript)");
;
;
"use strict";
const toLocalGlobalMixin = {
    getGlobalPosition () {
        let point = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"](), skipUpdate = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        if (this.parent) {
            this.parent.toGlobal(this._position, point, skipUpdate);
        } else {
            point.x = this._position.x;
            point.y = this._position.y;
        }
        return point;
    },
    toGlobal (position, point) {
        let skipUpdate = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
        const globalMatrix = this.getGlobalTransform(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].get(), skipUpdate);
        point = globalMatrix.apply(position, point);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].return(globalMatrix);
        return point;
    },
    toLocal (position, from, point, skipUpdate) {
        if (from) {
            position = from.toGlobal(position, point, skipUpdate);
        }
        const globalMatrix = this.getGlobalTransform(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].get(), skipUpdate);
        point = globalMatrix.applyInverse(position, point);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$utils$2f$matrixAndBoundsPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["matrixPool"].return(globalMatrix);
        return point;
    }
};
;
 //# sourceMappingURL=toLocalGlobalMixin.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroup.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderGroup",
    ()=>RenderGroup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$instructions$2f$InstructionSet$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/instructions/InstructionSet.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TexturePool.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
class RenderGroup {
    init(root) {
        this.root = root;
        if (root._onRender) this.addOnRender(root);
        root.didChange = true;
        const children = root.children;
        for(let i = 0; i < children.length; i++){
            const child = children[i];
            child._updateFlags = 15;
            this.addChild(child);
        }
    }
    enableCacheAsTexture() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        this.textureOptions = options;
        this.isCachedAsTexture = true;
        this.textureNeedsUpdate = true;
    }
    disableCacheAsTexture() {
        this.isCachedAsTexture = false;
        if (this.texture) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(this.texture, true);
            this.texture = null;
        }
    }
    updateCacheTexture() {
        this.textureNeedsUpdate = true;
        const cachedParent = this._parentCacheAsTextureRenderGroup;
        if (cachedParent && !cachedParent.textureNeedsUpdate) {
            cachedParent.updateCacheTexture();
        }
    }
    reset() {
        this.renderGroupChildren.length = 0;
        for(const i in this.childrenToUpdate){
            const childrenAtDepth = this.childrenToUpdate[i];
            childrenAtDepth.list.fill(null);
            childrenAtDepth.index = 0;
        }
        this.childrenRenderablesToUpdate.index = 0;
        this.childrenRenderablesToUpdate.list.fill(null);
        this.root = null;
        this.updateTick = 0;
        this.structureDidChange = true;
        this._onRenderContainers.length = 0;
        this.renderGroupParent = null;
        this.disableCacheAsTexture();
    }
    get localTransform() {
        return this.root.localTransform;
    }
    addRenderGroupChild(renderGroupChild) {
        if (renderGroupChild.renderGroupParent) {
            renderGroupChild.renderGroupParent._removeRenderGroupChild(renderGroupChild);
        }
        renderGroupChild.renderGroupParent = this;
        this.renderGroupChildren.push(renderGroupChild);
    }
    _removeRenderGroupChild(renderGroupChild) {
        const index = this.renderGroupChildren.indexOf(renderGroupChild);
        if (index > -1) {
            this.renderGroupChildren.splice(index, 1);
        }
        renderGroupChild.renderGroupParent = null;
    }
    addChild(child) {
        this.structureDidChange = true;
        child.parentRenderGroup = this;
        child.updateTick = -1;
        if (child.parent === this.root) {
            child.relativeRenderGroupDepth = 1;
        } else {
            child.relativeRenderGroupDepth = child.parent.relativeRenderGroupDepth + 1;
        }
        child.didChange = true;
        this.onChildUpdate(child);
        if (child.renderGroup) {
            this.addRenderGroupChild(child.renderGroup);
            return;
        }
        if (child._onRender) this.addOnRender(child);
        const children = child.children;
        for(let i = 0; i < children.length; i++){
            this.addChild(children[i]);
        }
    }
    removeChild(child) {
        this.structureDidChange = true;
        if (child._onRender) {
            if (!child.renderGroup) {
                this.removeOnRender(child);
            }
        }
        child.parentRenderGroup = null;
        if (child.renderGroup) {
            this._removeRenderGroupChild(child.renderGroup);
            return;
        }
        const children = child.children;
        for(let i = 0; i < children.length; i++){
            this.removeChild(children[i]);
        }
    }
    removeChildren(children) {
        for(let i = 0; i < children.length; i++){
            this.removeChild(children[i]);
        }
    }
    onChildUpdate(child) {
        let childrenToUpdate = this.childrenToUpdate[child.relativeRenderGroupDepth];
        if (!childrenToUpdate) {
            childrenToUpdate = this.childrenToUpdate[child.relativeRenderGroupDepth] = {
                index: 0,
                list: []
            };
        }
        childrenToUpdate.list[childrenToUpdate.index++] = child;
    }
    updateRenderable(renderable) {
        if (renderable.globalDisplayStatus < 7) return;
        this.instructionSet.renderPipes[renderable.renderPipeId].updateRenderable(renderable);
        renderable.didViewUpdate = false;
    }
    onChildViewUpdate(child) {
        this.childrenRenderablesToUpdate.list[this.childrenRenderablesToUpdate.index++] = child;
    }
    get isRenderable() {
        return this.root.localDisplayStatus === 7 && this.worldAlpha > 0;
    }
    /**
   * adding a container to the onRender list will make sure the user function
   * passed in to the user defined 'onRender` callBack
   * @param container - the container to add to the onRender list
   */ addOnRender(container) {
        this._onRenderContainers.push(container);
    }
    removeOnRender(container) {
        this._onRenderContainers.splice(this._onRenderContainers.indexOf(container), 1);
    }
    runOnRender(renderer) {
        for(let i = 0; i < this._onRenderContainers.length; i++){
            this._onRenderContainers[i]._onRender(renderer);
        }
    }
    destroy() {
        this.disableCacheAsTexture();
        this.renderGroupParent = null;
        this.root = null;
        this.childrenRenderablesToUpdate = null;
        this.childrenToUpdate = null;
        this.renderGroupChildren = null;
        this._onRenderContainers = null;
        this.instructionSet = null;
    }
    getChildren() {
        let out = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
        const children = this.root.children;
        for(let i = 0; i < children.length; i++){
            this._getChildren(children[i], out);
        }
        return out;
    }
    _getChildren(container) {
        let out = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
        out.push(container);
        if (container.renderGroup) return out;
        const children = container.children;
        for(let i = 0; i < children.length; i++){
            this._getChildren(children[i], out);
        }
        return out;
    }
    invalidateMatrices() {
        this._matrixDirty = 7;
    }
    /**
   * Returns the inverse of the world transform matrix.
   * @returns {Matrix} The inverse of the world transform matrix.
   */ get inverseWorldTransform() {
        if ((this._matrixDirty & 1) === 0) return this._inverseWorldTransform;
        this._matrixDirty &= ~1;
        this._inverseWorldTransform || (this._inverseWorldTransform = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]());
        return this._inverseWorldTransform.copyFrom(this.worldTransform).invert();
    }
    /**
   * Returns the inverse of the texture offset transform matrix.
   * @returns {Matrix} The inverse of the texture offset transform matrix.
   */ get textureOffsetInverseTransform() {
        if ((this._matrixDirty & 2) === 0) return this._textureOffsetInverseTransform;
        this._matrixDirty &= ~2;
        this._textureOffsetInverseTransform || (this._textureOffsetInverseTransform = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]());
        return this._textureOffsetInverseTransform.copyFrom(this.inverseWorldTransform).translate(-this._textureBounds.x, -this._textureBounds.y);
    }
    /**
   * Returns the inverse of the parent texture transform matrix.
   * This is used to properly transform coordinates when rendering into cached textures.
   * @returns {Matrix} The inverse of the parent texture transform matrix.
   */ get inverseParentTextureTransform() {
        if ((this._matrixDirty & 4) === 0) return this._inverseParentTextureTransform;
        this._matrixDirty &= ~4;
        const parentCacheAsTexture = this._parentCacheAsTextureRenderGroup;
        if (parentCacheAsTexture) {
            this._inverseParentTextureTransform || (this._inverseParentTextureTransform = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]());
            return this._inverseParentTextureTransform.copyFrom(this.worldTransform).prepend(parentCacheAsTexture.inverseWorldTransform).translate(-parentCacheAsTexture._textureBounds.x, -parentCacheAsTexture._textureBounds.y);
        }
        return this.worldTransform;
    }
    /**
   * Returns a matrix that transforms coordinates to the correct coordinate space of the texture being rendered to.
   * This is the texture offset inverse transform of the closest parent RenderGroup that is cached as a texture.
   * @returns {Matrix | null} The transform matrix for the cached texture coordinate space,
   * or null if no parent is cached as texture.
   */ get cacheToLocalTransform() {
        if (this.isCachedAsTexture) {
            return this.textureOffsetInverseTransform;
        }
        if (!this._parentCacheAsTextureRenderGroup) return null;
        return this._parentCacheAsTextureRenderGroup.textureOffsetInverseTransform;
    }
    constructor(){
        this.renderPipeId = "renderGroup";
        this.root = null;
        this.canBundle = false;
        this.renderGroupParent = null;
        this.renderGroupChildren = [];
        this.worldTransform = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
        this.worldColorAlpha = 4294967295;
        this.worldColor = 16777215;
        this.worldAlpha = 1;
        // these updates are transform changes..
        this.childrenToUpdate = /* @__PURE__ */ Object.create(null);
        this.updateTick = 0;
        this.gcTick = 0;
        // these update are renderable changes..
        this.childrenRenderablesToUpdate = {
            list: [],
            index: 0
        };
        // other
        this.structureDidChange = true;
        this.instructionSet = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$instructions$2f$InstructionSet$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InstructionSet"]();
        this._onRenderContainers = [];
        /**
     * Indicates if the cached texture needs to be updated.
     * @default true
     */ this.textureNeedsUpdate = true;
        /**
     * Indicates if the container should be cached as a texture.
     * @default false
     */ this.isCachedAsTexture = false;
        this._matrixDirty = 7;
    }
}
;
 //# sourceMappingURL=RenderGroup.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/assignWithIgnore.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "assignWithIgnore",
    ()=>assignWithIgnore
]);
"use strict";
function assignWithIgnore(target, options) {
    let ignore = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    for(const key in options){
        if (!ignore[key] && options[key] !== void 0) {
            target[key] = options[key];
        }
    }
}
;
 //# sourceMappingURL=assignWithIgnore.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/Container.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Container",
    ()=>Container,
    "UPDATE_BLEND",
    ()=>UPDATE_BLEND,
    "UPDATE_COLOR",
    ()=>UPDATE_COLOR,
    "UPDATE_TRANSFORM",
    ()=>UPDATE_TRANSFORM,
    "UPDATE_VISIBLE",
    ()=>UPDATE_VISIBLE
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$culling$2f$cullingMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/culling/cullingMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/misc/const.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/ObservablePoint.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$cacheAsTextureMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/cacheAsTextureMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$childrenHelperMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/childrenHelperMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$collectRenderablesMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/collectRenderablesMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$effectsMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/effectsMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$findMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/findMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$getFastGlobalBoundsMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/getFastGlobalBoundsMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$getGlobalMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/getGlobalMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$measureMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/measureMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$onRenderMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/onRenderMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$sortMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/sortMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$toLocalGlobalMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/container-mixins/toLocalGlobalMixin.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroup.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$assignWithIgnore$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/assignWithIgnore.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
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
const defaultSkew = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](null);
const defaultPivot = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](null);
const defaultScale = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](null, 1, 1);
const defaultOrigin = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](null);
const UPDATE_COLOR = 1;
const UPDATE_BLEND = 2;
const UPDATE_VISIBLE = 4;
const UPDATE_TRANSFORM = 8;
class Container extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    /**
   * Mixes all enumerable properties and methods from a source object to Container.
   * @param source - The source of properties and methods to mix in.
   * @deprecated since 8.8.0
   */ static mixin(source) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])("8.8.0", "Container.mixin is deprecated, please use extensions.mixin instead.");
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].mixin(Container, source);
    }
    // = 'default';
    /**
   * We now use the _didContainerChangeTick and _didViewChangeTick to track changes
   * @deprecated since 8.2.6
   * @ignore
   */ set _didChangeId(value) {
        this._didViewChangeTick = value >> 12 & 4095;
        this._didContainerChangeTick = value & 4095;
    }
    /** @ignore */ get _didChangeId() {
        return this._didContainerChangeTick & 4095 | (this._didViewChangeTick & 4095) << 12;
    }
    /**
   * Adds one or more children to the container.
   * The children will be rendered as part of this container's display list.
   * @example
   * ```ts
   * // Add a single child
   * container.addChild(sprite);
   *
   * // Add multiple children
   * container.addChild(background, player, foreground);
   *
   * // Add with type checking
   * const sprite = container.addChild<Sprite>(new Sprite(texture));
   * sprite.tint = 'red';
   * ```
   * @param children - The Container(s) to add to the container
   * @returns The first child that was added
   * @see {@link Container#removeChild} For removing children
   * @see {@link Container#addChildAt} For adding at specific index
   */ addChild() {
        for(var _len = arguments.length, children = new Array(_len), _key = 0; _key < _len; _key++){
            children[_key] = arguments[_key];
        }
        if (!this.allowChildren) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "addChild: Only Containers will be allowed to add children in v8.0.0");
        }
        if (children.length > 1) {
            for(let i = 0; i < children.length; i++){
                this.addChild(children[i]);
            }
            return children[0];
        }
        const child = children[0];
        const renderGroup = this.renderGroup || this.parentRenderGroup;
        if (child.parent === this) {
            this.children.splice(this.children.indexOf(child), 1);
            this.children.push(child);
            if (renderGroup) {
                renderGroup.structureDidChange = true;
            }
            return child;
        }
        if (child.parent) {
            child.parent.removeChild(child);
        }
        this.children.push(child);
        if (this.sortableChildren) this.sortDirty = true;
        child.parent = this;
        child.didChange = true;
        child._updateFlags = 15;
        if (renderGroup) {
            renderGroup.addChild(child);
        }
        this.emit("childAdded", child, this, this.children.length - 1);
        child.emit("added", this);
        this._didViewChangeTick++;
        if (child._zIndex !== 0) {
            child.depthOfChildModified();
        }
        return child;
    }
    /**
   * Removes one or more children from the container.
   * When removing multiple children, events will be triggered for each child in sequence.
   * @example
   * ```ts
   * // Remove a single child
   * const removed = container.removeChild(sprite);
   *
   * // Remove multiple children
   * const bg = container.removeChild(background, player, userInterface);
   *
   * // Remove with type checking
   * const sprite = container.removeChild<Sprite>(childSprite);
   * sprite.texture = newTexture;
   * ```
   * @param children - The Container(s) to remove
   * @returns The first child that was removed
   * @see {@link Container#addChild} For adding children
   * @see {@link Container#removeChildren} For removing multiple children
   */ removeChild() {
        for(var _len = arguments.length, children = new Array(_len), _key = 0; _key < _len; _key++){
            children[_key] = arguments[_key];
        }
        if (children.length > 1) {
            for(let i = 0; i < children.length; i++){
                this.removeChild(children[i]);
            }
            return children[0];
        }
        const child = children[0];
        const index = this.children.indexOf(child);
        if (index > -1) {
            this._didViewChangeTick++;
            this.children.splice(index, 1);
            if (this.renderGroup) {
                this.renderGroup.removeChild(child);
            } else if (this.parentRenderGroup) {
                this.parentRenderGroup.removeChild(child);
            }
            if (child.parentRenderLayer) {
                child.parentRenderLayer.detach(child);
            }
            child.parent = null;
            this.emit("childRemoved", child, this, index);
            child.emit("removed", this);
        }
        return child;
    }
    /** @ignore */ _onUpdate(point) {
        if (point) {
            if (point === this._skew) {
                this._updateSkew();
            }
        }
        this._didContainerChangeTick++;
        if (this.didChange) return;
        this.didChange = true;
        if (this.parentRenderGroup) {
            this.parentRenderGroup.onChildUpdate(this);
        }
    }
    set isRenderGroup(value) {
        if (!!this.renderGroup === value) return;
        if (value) {
            this.enableRenderGroup();
        } else {
            this.disableRenderGroup();
        }
    }
    /**
   * Returns true if this container is a render group.
   * This means that it will be rendered as a separate pass, with its own set of instructions
   * @advanced
   */ get isRenderGroup() {
        return !!this.renderGroup;
    }
    /**
   * Calling this enables a render group for this container.
   * This means it will be rendered as a separate set of instructions.
   * The transform of the container will also be handled on the GPU rather than the CPU.
   * @advanced
   */ enableRenderGroup() {
        if (this.renderGroup) return;
        const parentRenderGroup = this.parentRenderGroup;
        parentRenderGroup === null || parentRenderGroup === void 0 ? void 0 : parentRenderGroup.removeChild(this);
        this.renderGroup = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BigPool"].get(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RenderGroup"], this);
        this.groupTransform = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"].IDENTITY;
        parentRenderGroup === null || parentRenderGroup === void 0 ? void 0 : parentRenderGroup.addChild(this);
        this._updateIsSimple();
    }
    /**
   * This will disable the render group for this container.
   * @advanced
   */ disableRenderGroup() {
        if (!this.renderGroup) return;
        const parentRenderGroup = this.parentRenderGroup;
        parentRenderGroup === null || parentRenderGroup === void 0 ? void 0 : parentRenderGroup.removeChild(this);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BigPool"].return(this.renderGroup);
        this.renderGroup = null;
        this.groupTransform = this.relativeGroupTransform;
        parentRenderGroup === null || parentRenderGroup === void 0 ? void 0 : parentRenderGroup.addChild(this);
        this._updateIsSimple();
    }
    /** @ignore */ _updateIsSimple() {
        this.isSimple = !this.renderGroup && this.effects.length === 0;
    }
    /**
   * Current transform of the object based on world (parent) factors.
   *
   * This matrix represents the absolute transformation in the scene graph.
   * @example
   * ```ts
   * // Get world position
   * const worldPos = container.worldTransform;
   * console.log(`World position: (${worldPos.tx}, ${worldPos.ty})`);
   * ```
   * @readonly
   * @see {@link Container#localTransform} For local space transform
   */ get worldTransform() {
        this._worldTransform || (this._worldTransform = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]());
        if (this.renderGroup) {
            this._worldTransform.copyFrom(this.renderGroup.worldTransform);
        } else if (this.parentRenderGroup) {
            this._worldTransform.appendFrom(this.relativeGroupTransform, this.parentRenderGroup.worldTransform);
        }
        return this._worldTransform;
    }
    /**
   * The position of the container on the x axis relative to the local coordinates of the parent.
   *
   * An alias to position.x
   * @example
   * ```ts
   * // Basic position
   * container.x = 100;
   * ```
   */ get x() {
        return this._position.x;
    }
    set x(value) {
        this._position.x = value;
    }
    /**
   * The position of the container on the y axis relative to the local coordinates of the parent.
   *
   * An alias to position.y
   * @example
   * ```ts
   * // Basic position
   * container.y = 200;
   * ```
   */ get y() {
        return this._position.y;
    }
    set y(value) {
        this._position.y = value;
    }
    /**
   * The coordinate of the object relative to the local coordinates of the parent.
   * @example
   * ```ts
   * // Basic position setting
   * container.position.set(100, 200);
   * container.position.set(100); // Sets both x and y to 100
   * // Using point data
   * container.position = { x: 50, y: 75 };
   * ```
   * @since 4.0.0
   */ get position() {
        return this._position;
    }
    set position(value) {
        this._position.copyFrom(value);
    }
    /**
   * The rotation of the object in radians.
   *
   * > [!NOTE] 'rotation' and 'angle' have the same effect on a display object;
   * > rotation is in radians, angle is in degrees.
   * @example
   * ```ts
   * // Basic rotation
   * container.rotation = Math.PI / 4; // 45 degrees
   *
   * // Convert from degrees
   * const degrees = 45;
   * container.rotation = degrees * Math.PI / 180;
   *
   * // Rotate around center
   * container.pivot.set(container.width / 2, container.height / 2);
   * container.rotation = Math.PI; // 180 degrees
   *
   * // Rotate around center with origin
   * container.origin.set(container.width / 2, container.height / 2);
   * container.rotation = Math.PI; // 180 degrees
   * ```
   */ get rotation() {
        return this._rotation;
    }
    set rotation(value) {
        if (this._rotation !== value) {
            this._rotation = value;
            this._onUpdate(this._skew);
        }
    }
    /**
   * The angle of the object in degrees.
   *
   * > [!NOTE] 'rotation' and 'angle' have the same effect on a display object;
   * > rotation is in radians, angle is in degrees.
   * @example
   * ```ts
   * // Basic angle rotation
   * sprite.angle = 45; // 45 degrees
   *
   * // Rotate around center
   * sprite.pivot.set(sprite.width / 2, sprite.height / 2);
   * sprite.angle = 180; // Half rotation
   *
   * // Rotate around center with origin
   * sprite.origin.set(sprite.width / 2, sprite.height / 2);
   * sprite.angle = 180; // Half rotation
   *
   * // Reset rotation
   * sprite.angle = 0;
   * ```
   */ get angle() {
        return this.rotation * __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RAD_TO_DEG"];
    }
    set angle(value) {
        this.rotation = value * __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$misc$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEG_TO_RAD"];
    }
    /**
   * The center of rotation, scaling, and skewing for this display object in its local space.
   * The `position` is the projection of `pivot` in the parent's local space.
   *
   * By default, the pivot is the origin (0, 0).
   * @example
   * ```ts
   * // Rotate around center
   * container.pivot.set(container.width / 2, container.height / 2);
   * container.rotation = Math.PI; // Rotates around center
   * ```
   * @since 4.0.0
   */ get pivot() {
        if (this._pivot === defaultPivot) {
            this._pivot = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](this, 0, 0);
        }
        return this._pivot;
    }
    set pivot(value) {
        if (this._pivot === defaultPivot) {
            this._pivot = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](this, 0, 0);
            if (this._origin !== defaultOrigin) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])("Setting both a pivot and origin on a Container is not recommended. This can lead to unexpected behavior if not handled carefully.");
            }
        }
        typeof value === "number" ? this._pivot.set(value) : this._pivot.copyFrom(value);
    }
    /**
   * The skew factor for the object in radians. Skewing is a transformation that distorts
   * the object by rotating it differently at each point, creating a non-uniform shape.
   * @example
   * ```ts
   * // Basic skewing
   * container.skew.set(0.5, 0); // Skew horizontally
   * container.skew.set(0, 0.5); // Skew vertically
   *
   * // Skew with point data
   * container.skew = { x: 0.3, y: 0.3 }; // Diagonal skew
   *
   * // Reset skew
   * container.skew.set(0, 0);
   *
   * // Animate skew
   * app.ticker.add(() => {
   *     // Create wave effect
   *     container.skew.x = Math.sin(Date.now() / 1000) * 0.3;
   * });
   *
   * // Combine with rotation
   * container.rotation = Math.PI / 4; // 45 degrees
   * container.skew.set(0.2, 0.2); // Skew the rotated object
   * ```
   * @since 4.0.0
   * @type {ObservablePoint} Point-like object with x/y properties in radians
   * @default {x: 0, y: 0}
   */ get skew() {
        if (this._skew === defaultSkew) {
            this._skew = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](this, 0, 0);
        }
        return this._skew;
    }
    set skew(value) {
        if (this._skew === defaultSkew) {
            this._skew = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](this, 0, 0);
        }
        this._skew.copyFrom(value);
    }
    /**
   * The scale factors of this object along the local coordinate axes.
   *
   * The default scale is (1, 1).
   * @example
   * ```ts
   * // Basic scaling
   * container.scale.set(2, 2); // Scales to double size
   * container.scale.set(2); // Scales uniformly to double size
   * container.scale = 2; // Scales uniformly to double size
   * // Scale to a specific width and height
   * container.setSize(200, 100); // Sets width to 200 and height to 100
   * ```
   * @since 4.0.0
   */ get scale() {
        if (this._scale === defaultScale) {
            this._scale = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](this, 1, 1);
        }
        return this._scale;
    }
    set scale(value) {
        if (this._scale === defaultScale) {
            this._scale = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](this, 0, 0);
        }
        if (typeof value === "string") {
            value = parseFloat(value);
        }
        typeof value === "number" ? this._scale.set(value) : this._scale.copyFrom(value);
    }
    /**
   * @experimental
   * The origin point around which the container rotates and scales without affecting its position.
   * Unlike pivot, changing the origin will not move the container's position.
   * @example
   * ```ts
   * // Rotate around center point
   * container.origin.set(container.width / 2, container.height / 2);
   * container.rotation = Math.PI; // Rotates around center
   *
   * // Reset origin
   * container.origin.set(0, 0);
   * ```
   */ get origin() {
        if (this._origin === defaultOrigin) {
            this._origin = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](this, 0, 0);
        }
        return this._origin;
    }
    set origin(value) {
        if (this._origin === defaultOrigin) {
            this._origin = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](this, 0, 0);
            if (this._pivot !== defaultPivot) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])("Setting both a pivot and origin on a Container is not recommended. This can lead to unexpected behavior if not handled carefully.");
            }
        }
        typeof value === "number" ? this._origin.set(value) : this._origin.copyFrom(value);
    }
    /**
   * The width of the Container, setting this will actually modify the scale to achieve the value set.
   * > [!NOTE] Changing the width will adjust the scale.x property of the container while maintaining its aspect ratio.
   * > [!NOTE] If you want to set both width and height at the same time, use {@link Container#setSize}
   * as it is more optimized by not recalculating the local bounds twice.
   * @example
   * ```ts
   * // Basic width setting
   * container.width = 100;
   * // Optimized width setting
   * container.setSize(100, 100);
   * ```
   */ get width() {
        return Math.abs(this.scale.x * this.getLocalBounds().width);
    }
    set width(value) {
        const localWidth = this.getLocalBounds().width;
        this._setWidth(value, localWidth);
    }
    /**
   * The height of the Container,
   * > [!NOTE] Changing the height will adjust the scale.y property of the container while maintaining its aspect ratio.
   * > [!NOTE] If you want to set both width and height at the same time, use {@link Container#setSize}
   * as it is more optimized by not recalculating the local bounds twice.
   * @example
   * ```ts
   * // Basic height setting
   * container.height = 200;
   * // Optimized height setting
   * container.setSize(100, 200);
   * ```
   */ get height() {
        return Math.abs(this.scale.y * this.getLocalBounds().height);
    }
    set height(value) {
        const localHeight = this.getLocalBounds().height;
        this._setHeight(value, localHeight);
    }
    /**
   * Retrieves the size of the container as a [Size]{@link Size} object.
   *
   * This is faster than get the width and height separately.
   * @example
   * ```ts
   * // Basic size retrieval
   * const size = container.getSize();
   * console.log(`Size: ${size.width}x${size.height}`);
   *
   * // Reuse existing size object
   * const reuseSize = { width: 0, height: 0 };
   * container.getSize(reuseSize);
   * ```
   * @param out - Optional object to store the size in.
   * @returns The size of the container.
   */ getSize(out) {
        if (!out) {
            out = {};
        }
        const bounds = this.getLocalBounds();
        out.width = Math.abs(this.scale.x * bounds.width);
        out.height = Math.abs(this.scale.y * bounds.height);
        return out;
    }
    /**
   * Sets the size of the container to the specified width and height.
   * This is more efficient than setting width and height separately as it only recalculates bounds once.
   * @example
   * ```ts
   * // Basic size setting
   * container.setSize(100, 200);
   *
   * // Set uniform size
   * container.setSize(100); // Sets both width and height to 100
   * ```
   * @param value - This can be either a number or a [Size]{@link Size} object.
   * @param height - The height to set. Defaults to the value of `width` if not provided.
   */ setSize(value, height) {
        const size = this.getLocalBounds();
        if (typeof value === "object") {
            var _value_height;
            height = (_value_height = value.height) !== null && _value_height !== void 0 ? _value_height : value.width;
            value = value.width;
        } else {
            height !== null && height !== void 0 ? height : height = value;
        }
        value !== void 0 && this._setWidth(value, size.width);
        height !== void 0 && this._setHeight(height, size.height);
    }
    /** Called when the skew or the rotation changes. */ _updateSkew() {
        const rotation = this._rotation;
        const skew = this._skew;
        this._cx = Math.cos(rotation + skew._y);
        this._sx = Math.sin(rotation + skew._y);
        this._cy = -Math.sin(rotation - skew._x);
        this._sy = Math.cos(rotation - skew._x);
    }
    /**
   * Updates the transform properties of the container.
   * Allows partial updates of transform properties for optimized manipulation.
   * @example
   * ```ts
   * // Basic transform update
   * container.updateTransform({
   *     x: 100,
   *     y: 200,
   *     rotation: Math.PI / 4
   * });
   *
   * // Scale and rotate around center
   * sprite.updateTransform({
   *     pivotX: sprite.width / 2,
   *     pivotY: sprite.height / 2,
   *     scaleX: 2,
   *     scaleY: 2,
   *     rotation: Math.PI
   * });
   *
   * // Update position only
   * button.updateTransform({
   *     x: button.x + 10, // Move right
   *     y: button.y      // Keep same y
   * });
   * ```
   * @param opts - Transform options to update
   * @param opts.x - The x position
   * @param opts.y - The y position
   * @param opts.scaleX - The x-axis scale factor
   * @param opts.scaleY - The y-axis scale factor
   * @param opts.rotation - The rotation in radians
   * @param opts.skewX - The x-axis skew factor
   * @param opts.skewY - The y-axis skew factor
   * @param opts.pivotX - The x-axis pivot point
   * @param opts.pivotY - The y-axis pivot point
   * @returns This container, for chaining
   * @see {@link Container#setFromMatrix} For matrix-based transforms
   * @see {@link Container#position} For direct position access
   */ updateTransform(opts) {
        this.position.set(typeof opts.x === "number" ? opts.x : this.position.x, typeof opts.y === "number" ? opts.y : this.position.y);
        this.scale.set(typeof opts.scaleX === "number" ? opts.scaleX || 1 : this.scale.x, typeof opts.scaleY === "number" ? opts.scaleY || 1 : this.scale.y);
        this.rotation = typeof opts.rotation === "number" ? opts.rotation : this.rotation;
        this.skew.set(typeof opts.skewX === "number" ? opts.skewX : this.skew.x, typeof opts.skewY === "number" ? opts.skewY : this.skew.y);
        this.pivot.set(typeof opts.pivotX === "number" ? opts.pivotX : this.pivot.x, typeof opts.pivotY === "number" ? opts.pivotY : this.pivot.y);
        this.origin.set(typeof opts.originX === "number" ? opts.originX : this.origin.x, typeof opts.originY === "number" ? opts.originY : this.origin.y);
        return this;
    }
    /**
   * Updates the local transform properties by decomposing the given matrix.
   * Extracts position, scale, rotation, and skew from a transformation matrix.
   * @example
   * ```ts
   * // Basic matrix transform
   * const matrix = new Matrix()
   *     .translate(100, 100)
   *     .rotate(Math.PI / 4)
   *     .scale(2, 2);
   *
   * container.setFromMatrix(matrix);
   *
   * // Copy transform from another container
   * const source = new Container();
   * source.position.set(100, 100);
   * source.rotation = Math.PI / 2;
   *
   * target.setFromMatrix(source.localTransform);
   *
   * // Reset transform
   * container.setFromMatrix(Matrix.IDENTITY);
   * ```
   * @param matrix - The matrix to use for updating the transform
   * @see {@link Container#updateTransform} For property-based updates
   * @see {@link Matrix#decompose} For matrix decomposition details
   */ setFromMatrix(matrix) {
        matrix.decompose(this);
    }
    /** Updates the local transform. */ updateLocalTransform() {
        const localTransformChangeId = this._didContainerChangeTick;
        if (this._didLocalTransformChangeId === localTransformChangeId) return;
        this._didLocalTransformChangeId = localTransformChangeId;
        const lt = this.localTransform;
        const scale = this._scale;
        const pivot = this._pivot;
        const origin = this._origin;
        const position = this._position;
        const sx = scale._x;
        const sy = scale._y;
        const px = pivot._x;
        const py = pivot._y;
        const ox = -origin._x;
        const oy = -origin._y;
        lt.a = this._cx * sx;
        lt.b = this._sx * sx;
        lt.c = this._cy * sy;
        lt.d = this._sy * sy;
        lt.tx = position._x - (px * lt.a + py * lt.c) + (ox * lt.a + oy * lt.c) - ox;
        lt.ty = position._y - (px * lt.b + py * lt.d) + (ox * lt.b + oy * lt.d) - oy;
    }
    // / ///// color related stuff
    set alpha(value) {
        if (value === this.localAlpha) return;
        this.localAlpha = value;
        this._updateFlags |= UPDATE_COLOR;
        this._onUpdate();
    }
    /**
   * The opacity of the object relative to its parent's opacity.
   * Value ranges from 0 (fully transparent) to 1 (fully opaque).
   * @example
   * ```ts
   * // Basic transparency
   * sprite.alpha = 0.5; // 50% opacity
   *
   * // Inherited opacity
   * container.alpha = 0.5;
   * const child = new Sprite(texture);
   * child.alpha = 0.5;
   * container.addChild(child);
   * // child's effective opacity is 0.25 (0.5 * 0.5)
   * ```
   * @default 1
   * @see {@link Container#visible} For toggling visibility
   * @see {@link Container#renderable} For render control
   */ get alpha() {
        return this.localAlpha;
    }
    set tint(value) {
        const tempColor = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(value !== null && value !== void 0 ? value : 16777215);
        const bgr = tempColor.toBgrNumber();
        if (bgr === this.localColor) return;
        this.localColor = bgr;
        this._updateFlags |= UPDATE_COLOR;
        this._onUpdate();
    }
    /**
   * The tint applied to the sprite.
   *
   * This can be any valid {@link ColorSource}.
   * @example
   * ```ts
   * // Basic color tinting
   * container.tint = 0xff0000; // Red tint
   * container.tint = 'red';    // Same as above
   * container.tint = '#00ff00'; // Green
   * container.tint = 'rgb(0,0,255)'; // Blue
   *
   * // Remove tint
   * container.tint = 0xffffff; // White = no tint
   * container.tint = null;     // Also removes tint
   * ```
   * @default 0xFFFFFF
   * @see {@link Container#alpha} For transparency
   * @see {@link Container#visible} For visibility control
   */ get tint() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$getGlobalMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bgr2rgb"])(this.localColor);
    }
    // / //////////////// blend related stuff
    set blendMode(value) {
        if (this.localBlendMode === value) return;
        if (this.parentRenderGroup) {
            this.parentRenderGroup.structureDidChange = true;
        }
        this._updateFlags |= UPDATE_BLEND;
        this.localBlendMode = value;
        this._onUpdate();
    }
    /**
   * The blend mode to be applied to the sprite. Controls how pixels are blended when rendering.
   *
   * Setting to 'normal' will reset to default blending.
   * > [!NOTE] More blend modes are available after importing the `pixi.js/advanced-blend-modes` sub-export.
   * @example
   * ```ts
   * // Basic blend modes
   * sprite.blendMode = 'add';        // Additive blending
   * sprite.blendMode = 'multiply';   // Multiply colors
   * sprite.blendMode = 'screen';     // Screen blend
   *
   * // Reset blend mode
   * sprite.blendMode = 'normal';     // Normal blending
   * ```
   * @default 'normal'
   * @see {@link Container#alpha} For transparency
   * @see {@link Container#tint} For color adjustments
   */ get blendMode() {
        return this.localBlendMode;
    }
    // / ///////// VISIBILITY / RENDERABLE /////////////////
    /**
   * The visibility of the object. If false the object will not be drawn,
   * and the transform will not be updated.
   * @example
   * ```ts
   * // Basic visibility toggle
   * sprite.visible = false; // Hide sprite
   * sprite.visible = true;  // Show sprite
   * ```
   * @default true
   * @see {@link Container#renderable} For render-only control
   * @see {@link Container#alpha} For transparency
   */ get visible() {
        return !!(this.localDisplayStatus & 2);
    }
    set visible(value) {
        const valueNumber = value ? 2 : 0;
        if ((this.localDisplayStatus & 2) === valueNumber) return;
        if (this.parentRenderGroup) {
            this.parentRenderGroup.structureDidChange = true;
        }
        this._updateFlags |= UPDATE_VISIBLE;
        this.localDisplayStatus ^= 2;
        this._onUpdate();
    }
    /** @ignore */ get culled() {
        return !(this.localDisplayStatus & 4);
    }
    /** @ignore */ set culled(value) {
        const valueNumber = value ? 0 : 4;
        if ((this.localDisplayStatus & 4) === valueNumber) return;
        if (this.parentRenderGroup) {
            this.parentRenderGroup.structureDidChange = true;
        }
        this._updateFlags |= UPDATE_VISIBLE;
        this.localDisplayStatus ^= 4;
        this._onUpdate();
    }
    /**
   * Controls whether this object can be rendered. If false the object will not be drawn,
   * but the transform will still be updated. This is different from visible, which skips
   * transform updates.
   * @example
   * ```ts
   * // Basic render control
   * sprite.renderable = false; // Skip rendering
   * sprite.renderable = true;  // Enable rendering
   * ```
   * @default true
   * @see {@link Container#visible} For skipping transform updates
   * @see {@link Container#alpha} For transparency
   */ get renderable() {
        return !!(this.localDisplayStatus & 1);
    }
    set renderable(value) {
        const valueNumber = value ? 1 : 0;
        if ((this.localDisplayStatus & 1) === valueNumber) return;
        this._updateFlags |= UPDATE_VISIBLE;
        this.localDisplayStatus ^= 1;
        if (this.parentRenderGroup) {
            this.parentRenderGroup.structureDidChange = true;
        }
        this._onUpdate();
    }
    /**
   * Whether or not the object should be rendered.
   * @advanced
   */ get isRenderable() {
        return this.localDisplayStatus === 7 && this.groupAlpha > 0;
    }
    /**
   * Removes all internal references and listeners as well as removes children from the display list.
   * Do not use a Container after calling `destroy`.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @example
   * ```ts
   * container.destroy();
   * container.destroy(true);
   * container.destroy({ children: true });
   * container.destroy({ children: true, texture: true, textureSource: true });
   * ```
   */ destroy() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        var _this_renderGroup;
        if (this.destroyed) return;
        this.destroyed = true;
        let oldChildren;
        if (this.children.length) {
            oldChildren = this.removeChildren(0, this.children.length);
        }
        this.removeFromParent();
        this.parent = null;
        this._maskEffect = null;
        this._filterEffect = null;
        this.effects = null;
        this._position = null;
        this._scale = null;
        this._pivot = null;
        this._origin = null;
        this._skew = null;
        this.emit("destroyed", this);
        this.removeAllListeners();
        const destroyChildren = typeof options === "boolean" ? options : options === null || options === void 0 ? void 0 : options.children;
        if (destroyChildren && oldChildren) {
            for(let i = 0; i < oldChildren.length; ++i){
                oldChildren[i].destroy(options);
            }
        }
        (_this_renderGroup = this.renderGroup) === null || _this_renderGroup === void 0 ? void 0 : _this_renderGroup.destroy();
        this.renderGroup = null;
    }
    constructor(options = {}){
        var _options_children, _options_parent;
        super();
        /**
     * unique id for this container
     * @internal
     */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("renderable");
        /** @private */ this._updateFlags = 15;
        // the render group this container owns
        /** @private */ this.renderGroup = null;
        // the render group this container belongs to
        /** @private */ this.parentRenderGroup = null;
        // the index of the container in the render group
        /** @private */ this.parentRenderGroupIndex = 0;
        // set to true if the container has changed. It is reset once the changes have been applied
        // by the transform system
        // its here to stop ensure that when things change, only one update gets registers with the transform system
        /** @private */ this.didChange = false;
        // same as above, but for the renderable
        /** @private */ this.didViewUpdate = false;
        // how deep is the container relative to its render group..
        // unless the element is the root render group - it will be relative to its parent
        /** @private */ this.relativeRenderGroupDepth = 0;
        /**
     * The array of children of this container. Each child must be a Container or extend from it.
     *
     * The array is read-only, but its contents can be modified using Container methods.
     * @example
     * ```ts
     * // Access children
     * const firstChild = container.children[0];
     * const lastChild = container.children[container.children.length - 1];
     * ```
     * @readonly
     * @see {@link Container#addChild} For adding children
     * @see {@link Container#removeChild} For removing children
     */ this.children = [];
        /**
     * The display object container that contains this display object.
     * This represents the parent-child relationship in the display tree.
     * @example
     * ```ts
     * // Basic parent access
     * const parent = sprite.parent;
     *
     * // Walk up the tree
     * let current = sprite;
     * while (current.parent) {
     *     console.log('Level up:', current.parent.constructor.name);
     *     current = current.parent;
     * }
     * ```
     * @readonly
     * @see {@link Container#addChild} For adding to a parent
     * @see {@link Container#removeChild} For removing from parent
     */ this.parent = null;
        // used internally for changing up the render order.. mainly for masks and filters
        // TODO setting this should cause a rebuild??
        /** @private */ this.includeInBuild = true;
        /** @private */ this.measurable = true;
        /** @private */ this.isSimple = true;
        // / /////////////Transform related props//////////////
        // used by the transform system to check if a container needs to be updated that frame
        // if the tick matches the current transform system tick, it is not updated again
        /** @internal */ this.updateTick = -1;
        /**
     * Current transform of the object based on local factors: position, scale, other stuff.
     * This matrix represents the local transformation without any parent influence.
     * @example
     * ```ts
     * // Basic transform access
     * const localMatrix = sprite.localTransform;
     * console.log(localMatrix.toString());
     * ```
     * @readonly
     * @see {@link Container#worldTransform} For global transform
     * @see {@link Container#groupTransform} For render group transform
     */ this.localTransform = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
        /**
     * The relative group transform is a transform relative to the render group it belongs too. It will include all parent
     * transforms and up to the render group (think of it as kind of like a stage - but the stage can be nested).
     * If this container is is self a render group matrix will be relative to its parent render group
     * @readonly
     * @advanced
     */ this.relativeGroupTransform = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
        /**
     * The group transform is a transform relative to the render group it belongs too.
     * If this container is render group then this will be an identity matrix. other wise it
     * will be the same as the relativeGroupTransform.
     * Use this value when actually rendering things to the screen
     * @readonly
     * @advanced
     */ this.groupTransform = this.relativeGroupTransform;
        /**
     * Whether this object has been destroyed. If true, the object should no longer be used.
     * After an object is destroyed, all of its functionality is disabled and references are removed.
     * @example
     * ```ts
     * // Cleanup with destroy
     * sprite.destroy();
     * console.log(sprite.destroyed); // true
     * ```
     * @default false
     * @see {@link Container#destroy} For destroying objects
     */ this.destroyed = false;
        // transform data..
        /**
     * The coordinate of the object relative to the local coordinates of the parent.
     * @internal
     */ this._position = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"](this, 0, 0);
        /**
     * The scale factor of the object.
     * @internal
     */ this._scale = defaultScale;
        /**
     * The pivot point of the container that it rotates around.
     * @internal
     */ this._pivot = defaultPivot;
        /**
     * The origin point around which the container rotates and scales.
     * Unlike pivot, changing origin will not move the container's position.
     * @private
     */ this._origin = defaultOrigin;
        /**
     * The skew amount, on the x and y axis.
     * @internal
     */ this._skew = defaultSkew;
        /**
     * The X-coordinate value of the normalized local X axis,
     * the first column of the local transformation matrix without a scale.
     * @internal
     */ this._cx = 1;
        /**
     * The Y-coordinate value of the normalized local X axis,
     * the first column of the local transformation matrix without a scale.
     * @internal
     */ this._sx = 0;
        /**
     * The X-coordinate value of the normalized local Y axis,
     * the second column of the local transformation matrix without a scale.
     * @internal
     */ this._cy = 0;
        /**
     * The Y-coordinate value of the normalized local Y axis,
     * the second column of the local transformation matrix without a scale.
     * @internal
     */ this._sy = 1;
        /**
     * The rotation amount.
     * @internal
     */ this._rotation = 0;
        // / COLOR related props //////////////
        // color stored as ABGR
        /** @internal */ this.localColor = 16777215;
        /** @internal */ this.localAlpha = 1;
        /** @internal */ this.groupAlpha = 1;
        // A
        /** @internal */ this.groupColor = 16777215;
        // BGR
        /** @internal */ this.groupColorAlpha = 4294967295;
        // ABGR
        // / BLEND related props //////////////
        /** @internal */ this.localBlendMode = "inherit";
        /** @internal */ this.groupBlendMode = "normal";
        // / VISIBILITY related props //////////////
        // visibility
        // 0b11
        // first bit is visible, second bit is renderable
        /**
     * This property holds three bits: culled, visible, renderable
     * the third bit represents culling (0 = culled, 1 = not culled) 0b100
     * the second bit represents visibility (0 = not visible, 1 = visible) 0b010
     * the first bit represents renderable (0 = not renderable, 1 = renderable) 0b001
     * @internal
     */ this.localDisplayStatus = 7;
        // 0b11 | 0b10 | 0b01 | 0b00
        /** @internal */ this.globalDisplayStatus = 7;
        /**
     * A value that increments each time the containe is modified
     * eg children added, removed etc
     * @ignore
     */ this._didContainerChangeTick = 0;
        /**
     * A value that increments each time the container view is modified
     * eg texture swap, geometry change etc
     * @ignore
     */ this._didViewChangeTick = 0;
        /**
     * property that tracks if the container transform has changed
     * @ignore
     */ this._didLocalTransformChangeId = -1;
        this.effects = [];
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$assignWithIgnore$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assignWithIgnore"])(this, options, {
            children: true,
            parent: true,
            effects: true
        });
        (_options_children = options.children) === null || _options_children === void 0 ? void 0 : _options_children.forEach((child)=>this.addChild(child));
        (_options_parent = options.parent) === null || _options_parent === void 0 ? void 0 : _options_parent.addChild(this);
    }
}
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].mixin(Container, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$childrenHelperMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["childrenHelperMixin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$getFastGlobalBoundsMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFastGlobalBoundsMixin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$toLocalGlobalMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toLocalGlobalMixin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$onRenderMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onRenderMixin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$measureMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["measureMixin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$effectsMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["effectsMixin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$findMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findMixin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$sortMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sortMixin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$culling$2f$cullingMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cullingMixin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$cacheAsTextureMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cacheAsTextureMixin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$getGlobalMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGlobalMixin"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$container$2d$mixins$2f$collectRenderablesMixin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collectRenderablesMixin"]);
;
 //# sourceMappingURL=Container.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/view/ViewContainer.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ViewContainer",
    ()=>ViewContainer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/Container.mjs [app-client] (ecmascript)");
;
;
"use strict";
class ViewContainer extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Container"] {
    /**
   * The local bounds of the view in its own coordinate space.
   * Bounds are automatically updated when the view's content changes.
   * @example
   * ```ts
   * // Get bounds dimensions
   * const bounds = view.bounds;
   * console.log(`Width: ${bounds.maxX - bounds.minX}`);
   * console.log(`Height: ${bounds.maxY - bounds.minY}`);
   * ```
   * @returns The rectangular bounds of the view
   * @see {@link Bounds} For bounds operations
   */ get bounds() {
        if (!this._boundsDirty) return this._bounds;
        this.updateBounds();
        this._boundsDirty = false;
        return this._bounds;
    }
    /**
   * Whether or not to round the x/y position of the sprite.
   * @example
   * ```ts
   * // Enable pixel rounding for crisp rendering
   * view.roundPixels = true;
   * ```
   * @default false
   */ get roundPixels() {
        return !!this._roundPixels;
    }
    set roundPixels(value) {
        this._roundPixels = value ? 1 : 0;
    }
    /**
   * Checks if the object contains the given point in local coordinates.
   * Uses the view's bounds for hit testing.
   * @example
   * ```ts
   * // Basic point check
   * const localPoint = { x: 50, y: 25 };
   * const contains = view.containsPoint(localPoint);
   * console.log('Point is inside:', contains);
   * ```
   * @param point - The point to check in local coordinates
   * @returns True if the point is within the view's bounds
   * @see {@link ViewContainer#bounds} For the bounds used in hit testing
   * @see {@link Container#toLocal} For converting global coordinates to local
   */ containsPoint(point) {
        const bounds = this.bounds;
        const { x, y } = point;
        return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
    }
    /** @private */ onViewUpdate() {
        this._didViewChangeTick++;
        this._boundsDirty = true;
        if (this.didViewUpdate) return;
        this.didViewUpdate = true;
        const renderGroup = this.renderGroup || this.parentRenderGroup;
        if (renderGroup) {
            renderGroup.onChildViewUpdate(this);
        }
    }
    destroy(options) {
        super.destroy(options);
        this._bounds = null;
        for(const key in this._gpuData){
            var _this__gpuData_key_destroy, _this__gpuData_key;
            (_this__gpuData_key_destroy = (_this__gpuData_key = this._gpuData[key]).destroy) === null || _this__gpuData_key_destroy === void 0 ? void 0 : _this__gpuData_key_destroy.call(_this__gpuData_key);
        }
        this._gpuData = null;
    }
    /**
   * Collects renderables for the view container.
   * @param instructionSet - The instruction set to collect renderables for.
   * @param renderer - The renderer to collect renderables for.
   * @param currentLayer - The current render layer.
   * @internal
   */ collectRenderablesSimple(instructionSet, renderer, currentLayer) {
        const { renderPipes } = renderer;
        renderPipes.blendMode.pushBlendMode(this, this.groupBlendMode, instructionSet);
        const rp = renderPipes;
        rp[this.renderPipeId].addRenderable(this, instructionSet);
        this.didViewUpdate = false;
        const children = this.children;
        const length = children.length;
        for(let i = 0; i < length; i++){
            children[i].collectRenderables(instructionSet, renderer, currentLayer);
        }
        renderPipes.blendMode.popBlendMode(instructionSet);
    }
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(options){
        super(options);
        /** @internal */ this.canBundle = true;
        /** @internal */ this.allowChildren = false;
        /** @internal */ this._roundPixels = 0;
        /** @internal */ this._lastUsed = -1;
        /** @internal */ this._gpuData = /* @__PURE__ */ Object.create(null);
        this._bounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Bounds"](0, 1, 0, 0);
        this._boundsDirty = true;
    }
}
;
 //# sourceMappingURL=ViewContainer.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/Sprite.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sprite",
    ()=>Sprite
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/ObservablePoint.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$updateQuadBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/updateQuadBounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$view$2f$ViewContainer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/view/ViewContainer.mjs [app-client] (ecmascript)");
;
;
;
;
;
"use strict";
class Sprite extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$view$2f$ViewContainer$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ViewContainer"] {
    /**
   * Creates a new sprite based on a source texture, image, video, or canvas element.
   * This is a convenience method that automatically creates and manages textures.
   * @example
   * ```ts
   * // Create from path or URL
   * const sprite = Sprite.from('assets/image.png');
   *
   * // Create from existing texture
   * const sprite = Sprite.from(texture);
   *
   * // Create from canvas
   * const canvas = document.createElement('canvas');
   * const sprite = Sprite.from(canvas, true); // Skip caching new texture
   * ```
   * @param source - The source to create the sprite from. Can be a path to an image, a texture,
   * or any valid texture source (canvas, video, etc.)
   * @param skipCache - Whether to skip adding to the texture cache when creating a new texture
   * @returns A new sprite based on the source
   * @see {@link Texture.from} For texture creation details
   * @see {@link Assets} For asset loading and management
   */ static from(source) {
        let skipCache = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        if (source instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]) {
            return new Sprite(source);
        }
        return new Sprite(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].from(source, skipCache));
    }
    set texture(value) {
        value || (value = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].EMPTY);
        const currentTexture = this._texture;
        if (currentTexture === value) return;
        if (currentTexture && currentTexture.dynamic) currentTexture.off("update", this.onViewUpdate, this);
        if (value.dynamic) value.on("update", this.onViewUpdate, this);
        this._texture = value;
        if (this._width) {
            this._setWidth(this._width, this._texture.orig.width);
        }
        if (this._height) {
            this._setHeight(this._height, this._texture.orig.height);
        }
        this.onViewUpdate();
    }
    /**
   * The texture that is displayed by the sprite. When changed, automatically updates
   * the sprite dimensions and manages texture event listeners.
   * @example
   * ```ts
   * // Create sprite with texture
   * const sprite = new Sprite({
   *     texture: Texture.from('sprite.png')
   * });
   *
   * // Update texture
   * sprite.texture = Texture.from('newSprite.png');
   *
   * // Use texture from spritesheet
   * const sheet = await Assets.load('spritesheet.json');
   * sprite.texture = sheet.textures['frame1.png'];
   *
   * // Reset to empty texture
   * sprite.texture = Texture.EMPTY;
   * ```
   * @see {@link Texture} For texture creation and management
   * @see {@link Assets} For asset loading
   */ get texture() {
        return this._texture;
    }
    /**
   * The bounds of the sprite, taking into account the texture's trim area.
   * @example
   * ```ts
   * const texture = new Texture({
   *     source: new TextureSource({ width: 300, height: 300 }),
   *     frame: new Rectangle(196, 66, 58, 56),
   *     trim: new Rectangle(4, 4, 58, 56),
   *     orig: new Rectangle(0, 0, 64, 64),
   *     rotate: 2,
   * });
   * const sprite = new Sprite(texture);
   * const visualBounds = sprite.visualBounds;
   * // console.log(visualBounds); // { minX: -4, maxX: 62, minY: -4, maxY: 60 }
   */ get visualBounds() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$updateQuadBounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateQuadBounds"])(this._visualBounds, this._anchor, this._texture);
        return this._visualBounds;
    }
    /**
   * @deprecated
   * @ignore
   */ get sourceBounds() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])("8.6.1", "Sprite.sourceBounds is deprecated, use visualBounds instead.");
        return this.visualBounds;
    }
    /** @private */ updateBounds() {
        const anchor = this._anchor;
        const texture = this._texture;
        const bounds = this._bounds;
        const { width, height } = texture.orig;
        bounds.minX = -anchor._x * width;
        bounds.maxX = bounds.minX + width;
        bounds.minY = -anchor._y * height;
        bounds.maxY = bounds.minY + height;
    }
    /**
   * Destroys this sprite renderable and optionally its texture.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @example
   * sprite.destroy();
   * sprite.destroy(true);
   * sprite.destroy({ texture: true, textureSource: true });
   */ destroy() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        super.destroy(options);
        const destroyTexture = typeof options === "boolean" ? options : options === null || options === void 0 ? void 0 : options.texture;
        if (destroyTexture) {
            const destroyTextureSource = typeof options === "boolean" ? options : options === null || options === void 0 ? void 0 : options.textureSource;
            this._texture.destroy(destroyTextureSource);
        }
        this._texture = null;
        this._visualBounds = null;
        this._bounds = null;
        this._anchor = null;
        this._gpuData = null;
    }
    /**
   * The anchor sets the origin point of the sprite. The default value is taken from the {@link Texture}
   * and passed to the constructor.
   *
   * - The default is `(0,0)`, this means the sprite's origin is the top left.
   * - Setting the anchor to `(0.5,0.5)` means the sprite's origin is centered.
   * - Setting the anchor to `(1,1)` would mean the sprite's origin point will be the bottom right corner.
   *
   * If you pass only single parameter, it will set both x and y to the same value as shown in the example below.
   * @example
   * ```ts
   * // Center the anchor point
   * sprite.anchor = 0.5; // Sets both x and y to 0.5
   * sprite.position.set(400, 300); // Sprite will be centered at this position
   *
   * // Set specific x/y anchor points
   * sprite.anchor = {
   *     x: 1, // Right edge
   *     y: 0  // Top edge
   * };
   *
   * // Using individual coordinates
   * sprite.anchor.set(0.5, 1); // Center-bottom
   *
   * // For rotation around center
   * sprite.anchor.set(0.5);
   * sprite.rotation = Math.PI / 4; // 45 degrees around center
   *
   * // For scaling from center
   * sprite.anchor.set(0.5);
   * sprite.scale.set(2); // Scales from center point
   * ```
   */ get anchor() {
        return this._anchor;
    }
    set anchor(value) {
        typeof value === "number" ? this._anchor.set(value) : this._anchor.copyFrom(value);
    }
    /**
   * The width of the sprite, setting this will actually modify the scale to achieve the value set.
   * @example
   * ```ts
   * // Set width directly
   * sprite.width = 200;
   * console.log(sprite.scale.x); // Scale adjusted to match width
   *
   * // Set width while preserving aspect ratio
   * const ratio = sprite.height / sprite.width;
   * sprite.width = 300;
   * sprite.height = 300 * ratio;
   *
   * // For better performance when setting both width and height
   * sprite.setSize(300, 400); // Avoids recalculating bounds twice
   *
   * // Reset to original texture size
   * sprite.width = sprite.texture.orig.width;
   * ```
   */ get width() {
        return Math.abs(this.scale.x) * this._texture.orig.width;
    }
    set width(value) {
        this._setWidth(value, this._texture.orig.width);
        this._width = value;
    }
    /**
   * The height of the sprite, setting this will actually modify the scale to achieve the value set.
   * @example
   * ```ts
   * // Set height directly
   * sprite.height = 150;
   * console.log(sprite.scale.y); // Scale adjusted to match height
   *
   * // Set height while preserving aspect ratio
   * const ratio = sprite.width / sprite.height;
   * sprite.height = 200;
   * sprite.width = 200 * ratio;
   *
   * // For better performance when setting both width and height
   * sprite.setSize(300, 400); // Avoids recalculating bounds twice
   *
   * // Reset to original texture size
   * sprite.height = sprite.texture.orig.height;
   * ```
   */ get height() {
        return Math.abs(this.scale.y) * this._texture.orig.height;
    }
    set height(value) {
        this._setHeight(value, this._texture.orig.height);
        this._height = value;
    }
    /**
   * Retrieves the size of the Sprite as a [Size]{@link Size} object based on the texture dimensions and scale.
   * This is faster than getting width and height separately as it only calculates the bounds once.
   * @example
   * ```ts
   * // Basic size retrieval
   * const sprite = new Sprite(Texture.from('sprite.png'));
   * const size = sprite.getSize();
   * console.log(`Size: ${size.width}x${size.height}`);
   *
   * // Reuse existing size object
   * const reuseSize = { width: 0, height: 0 };
   * sprite.getSize(reuseSize);
   * ```
   * @param out - Optional object to store the size in, to avoid allocating a new object
   * @returns The size of the Sprite
   * @see {@link Sprite#width} For getting just the width
   * @see {@link Sprite#height} For getting just the height
   * @see {@link Sprite#setSize} For setting both width and height
   */ getSize(out) {
        out || (out = {});
        out.width = Math.abs(this.scale.x) * this._texture.orig.width;
        out.height = Math.abs(this.scale.y) * this._texture.orig.height;
        return out;
    }
    /**
   * Sets the size of the Sprite to the specified width and height.
   * This is faster than setting width and height separately as it only recalculates bounds once.
   * @example
   * ```ts
   * // Basic size setting
   * const sprite = new Sprite(Texture.from('sprite.png'));
   * sprite.setSize(100, 200); // Width: 100, Height: 200
   *
   * // Set uniform size
   * sprite.setSize(100); // Sets both width and height to 100
   *
   * // Set size with object
   * sprite.setSize({
   *     width: 200,
   *     height: 300
   * });
   *
   * // Reset to texture size
   * sprite.setSize(
   *     sprite.texture.orig.width,
   *     sprite.texture.orig.height
   * );
   * ```
   * @param value - This can be either a number or a {@link Size} object
   * @param height - The height to set. Defaults to the value of `width` if not provided
   * @see {@link Sprite#width} For setting width only
   * @see {@link Sprite#height} For setting height only
   * @see {@link Sprite#texture} For the source dimensions
   */ setSize(value, height) {
        if (typeof value === "object") {
            var _value_height;
            height = (_value_height = value.height) !== null && _value_height !== void 0 ? _value_height : value.width;
            value = value.width;
        } else {
            height !== null && height !== void 0 ? height : height = value;
        }
        value !== void 0 && this._setWidth(value, this._texture.orig.width);
        height !== void 0 && this._setHeight(height, this._texture.orig.height);
    }
    /**
   * @param options - The options for creating the sprite.
   */ constructor(options = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].EMPTY){
        if (options instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]) {
            options = {
                texture: options
            };
        }
        const { texture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].EMPTY, anchor, roundPixels, width, height, ...rest } = options;
        super({
            label: "Sprite",
            ...rest
        });
        /** @internal */ this.renderPipeId = "sprite";
        /** @internal */ this.batched = true;
        this._visualBounds = {
            minX: 0,
            maxX: 1,
            minY: 0,
            maxY: 0
        };
        this._anchor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$ObservablePoint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObservablePoint"]({
            _onUpdate: ()=>{
                this.onViewUpdate();
            }
        });
        if (anchor) {
            this.anchor = anchor;
        } else if (texture.defaultAnchor) {
            this.anchor = texture.defaultAnchor;
        }
        this.texture = texture;
        this.allowChildren = false;
        this.roundPixels = roundPixels !== null && roundPixels !== void 0 ? roundPixels : false;
        if (width !== void 0) this.width = width;
        if (height !== void 0) this.height = height;
    }
}
;
 //# sourceMappingURL=Sprite.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/AbstractBitmapFont.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AbstractBitmapFont",
    ()=>AbstractBitmapFont
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
;
;
"use strict";
class AbstractBitmapFont extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    /**
   * The name of the font face.
   * @deprecated since 8.0.0 Use `fontFamily` instead.
   */ get font() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "BitmapFont.font is deprecated, please use BitmapFont.fontFamily instead.");
        return this.fontFamily;
    }
    /**
   * The map of base page textures (i.e., sheets of glyphs).
   * @deprecated since 8.0.0 Use `pages` instead.
   */ get pageTextures() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead.");
        return this.pages;
    }
    /**
   * The size of the font face in pixels.
   * @deprecated since 8.0.0 Use `fontMetrics.fontSize` instead.
   */ get size() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "BitmapFont.size is deprecated, please use BitmapFont.fontMetrics.fontSize instead.");
        return this.fontMetrics.fontSize;
    }
    /**
   * The kind of distance field for this font or "none".
   * @deprecated since 8.0.0 Use `distanceField.type` instead.
   */ get distanceFieldRange() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "BitmapFont.distanceFieldRange is deprecated, please use BitmapFont.distanceField.range instead.");
        return this.distanceField.range;
    }
    /**
   * The range of the distance field in pixels.
   * @deprecated since 8.0.0 Use `distanceField.range` instead.
   */ get distanceFieldType() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "BitmapFont.distanceFieldType is deprecated, please use BitmapFont.distanceField.type instead.");
        return this.distanceField.type;
    }
    destroy() {
        let destroyTextures = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        this.emit("destroy", this);
        this.removeAllListeners();
        for(const i in this.chars){
            var _this_chars_i_texture;
            (_this_chars_i_texture = this.chars[i].texture) === null || _this_chars_i_texture === void 0 ? void 0 : _this_chars_i_texture.destroy();
        }
        this.chars = null;
        if (destroyTextures) {
            this.pages.forEach((page)=>page.texture.destroy(true));
            this.pages = null;
        }
    }
    constructor(){
        super(...arguments);
        /** The map of characters by character code. */ this.chars = /* @__PURE__ */ Object.create(null);
        /**
     * The line-height of the font face in pixels.
     * @type {number}
     */ this.lineHeight = 0;
        /**
     * The name of the font face
     * @type {string}
     */ this.fontFamily = "";
        /** The metrics of the font face. */ this.fontMetrics = {
            fontSize: 0,
            ascent: 0,
            descent: 0
        };
        /**
     * The offset of the font face from the baseline.
     * @type {number}
     */ this.baseLineOffset = 0;
        /** The range and type of the distance field for this font. */ this.distanceField = {
            type: "none",
            range: 0
        };
        /** The map of base page textures (i.e., sheets of glyphs). */ this.pages = [];
        /** should the fill for this font be applied as a tint to the text. */ this.applyFillAsTint = true;
        /** The size of the font face in pixels. */ this.baseMeasurementFontSize = 100;
        this.baseRenderedFontSize = 100;
    }
}
;
 //# sourceMappingURL=AbstractBitmapFont.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/utils/fontStringFromTextStyle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fontStringFromTextStyle",
    ()=>fontStringFromTextStyle
]);
"use strict";
const genericFontFamilies = [
    "serif",
    "sans-serif",
    "monospace",
    "cursive",
    "fantasy",
    "system-ui"
];
function fontStringFromTextStyle(style) {
    const fontSizeString = typeof style.fontSize === "number" ? "".concat(style.fontSize, "px") : style.fontSize;
    let fontFamilies = style.fontFamily;
    if (!Array.isArray(style.fontFamily)) {
        fontFamilies = style.fontFamily.split(",");
    }
    for(let i = fontFamilies.length - 1; i >= 0; i--){
        let fontFamily = fontFamilies[i].trim();
        if (!/([\"\'])[^\'\"]+\1/.test(fontFamily) && !genericFontFamilies.includes(fontFamily)) {
            fontFamily = '"'.concat(fontFamily, '"');
        }
        fontFamilies[i] = fontFamily;
    }
    return "".concat(style.fontStyle, " ").concat(style.fontVariant, " ").concat(style.fontWeight, " ").concat(fontSizeString, " ").concat(fontFamilies.join(","));
}
;
 //# sourceMappingURL=fontStringFromTextStyle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextMetrics.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CanvasTextMetrics",
    ()=>CanvasTextMetrics
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tiny$2d$lru$40$11$2e$4$2e$5$2f$node_modules$2f$tiny$2d$lru$2f$dist$2f$tiny$2d$lru$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/tiny-lru@11.4.5/node_modules/tiny-lru/dist/tiny-lru.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$fontStringFromTextStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/utils/fontStringFromTextStyle.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
const contextSettings = {
    // TextMetrics requires getImageData readback for measuring fonts.
    willReadFrequently: true
};
const _CanvasTextMetrics = class _CanvasTextMetrics {
    /**
   * Checking that we can use modern canvas 2D API.
   *
   * Note: This is an unstable API, Chrome < 94 use `textLetterSpacing`, later versions use `letterSpacing`.
   * @see TextMetrics.experimentalLetterSpacing
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ICanvasRenderingContext2D/letterSpacing
   * @see https://developer.chrome.com/origintrials/#/view_trial/3585991203293757441
   */ static get experimentalLetterSpacingSupported() {
        let result = _CanvasTextMetrics._experimentalLetterSpacingSupported;
        if (result === void 0) {
            const proto = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getCanvasRenderingContext2D().prototype;
            result = _CanvasTextMetrics._experimentalLetterSpacingSupported = "letterSpacing" in proto || "textLetterSpacing" in proto;
        }
        return result;
    }
    /**
   * Measures the supplied string of text and returns a Rectangle.
   * @param text - The text to measure.
   * @param style - The text style to use for measuring
   * @param canvas - optional specification of the canvas to use for measuring.
   * @param wordWrap
   * @returns Measured width and height of the text.
   */ static measureText() {
        let text = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : " ", style = arguments.length > 1 ? arguments[1] : void 0, canvas = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : _CanvasTextMetrics._canvas, wordWrap = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : style.wordWrap;
        var _style__stroke;
        const textKey = "".concat(text, "-").concat(style.styleKey, "-wordWrap-").concat(wordWrap);
        if (_CanvasTextMetrics._measurementCache.has(textKey)) {
            return _CanvasTextMetrics._measurementCache.get(textKey);
        }
        const font = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$fontStringFromTextStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fontStringFromTextStyle"])(style);
        const fontProperties = _CanvasTextMetrics.measureFont(font);
        if (fontProperties.fontSize === 0) {
            fontProperties.fontSize = style.fontSize;
            fontProperties.ascent = style.fontSize;
        }
        const context = _CanvasTextMetrics.__context;
        context.font = font;
        const outputText = wordWrap ? _CanvasTextMetrics._wordWrap(text, style, canvas) : text;
        const lines = outputText.split(/(?:\r\n|\r|\n)/);
        const lineWidths = new Array(lines.length);
        let maxLineWidth = 0;
        for(let i = 0; i < lines.length; i++){
            const lineWidth = _CanvasTextMetrics._measureText(lines[i], style.letterSpacing, context);
            lineWidths[i] = lineWidth;
            maxLineWidth = Math.max(maxLineWidth, lineWidth);
        }
        const strokeWidth = ((_style__stroke = style._stroke) === null || _style__stroke === void 0 ? void 0 : _style__stroke.width) || 0;
        let width = maxLineWidth + strokeWidth;
        if (style.dropShadow) {
            width += style.dropShadow.distance;
        }
        const lineHeight = style.lineHeight || fontProperties.fontSize;
        let height = Math.max(lineHeight, fontProperties.fontSize + strokeWidth) + (lines.length - 1) * (lineHeight + style.leading);
        if (style.dropShadow) {
            height += style.dropShadow.distance;
        }
        const measurements = new _CanvasTextMetrics(text, style, width, height, lines, lineWidths, lineHeight + style.leading, maxLineWidth, fontProperties);
        _CanvasTextMetrics._measurementCache.set(textKey, measurements);
        return measurements;
    }
    static _measureText(text, letterSpacing, context) {
        let useExperimentalLetterSpacing = false;
        if (_CanvasTextMetrics.experimentalLetterSpacingSupported) {
            if (_CanvasTextMetrics.experimentalLetterSpacing) {
                context.letterSpacing = "".concat(letterSpacing, "px");
                context.textLetterSpacing = "".concat(letterSpacing, "px");
                useExperimentalLetterSpacing = true;
            } else {
                context.letterSpacing = "0px";
                context.textLetterSpacing = "0px";
            }
        }
        const metrics = context.measureText(text);
        let metricWidth = metrics.width;
        const actualBoundingBoxLeft = -metrics.actualBoundingBoxLeft;
        const actualBoundingBoxRight = metrics.actualBoundingBoxRight;
        let boundsWidth = actualBoundingBoxRight - actualBoundingBoxLeft;
        if (metricWidth > 0) {
            if (useExperimentalLetterSpacing) {
                metricWidth -= letterSpacing;
                boundsWidth -= letterSpacing;
            } else {
                const val = (_CanvasTextMetrics.graphemeSegmenter(text).length - 1) * letterSpacing;
                metricWidth += val;
                boundsWidth += val;
            }
        }
        return Math.max(metricWidth, boundsWidth);
    }
    /**
   * Applies newlines to a string to have it optimally fit into the horizontal
   * bounds set by the Text object's wordWrapWidth property.
   * @param text - String to apply word wrapping to
   * @param style - the style to use when wrapping
   * @param canvas - optional specification of the canvas to use for measuring.
   * @returns New string with new lines applied where required
   */ static _wordWrap(text, style) {
        let canvas = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : _CanvasTextMetrics._canvas;
        const context = canvas.getContext("2d", contextSettings);
        let width = 0;
        let line = "";
        let lines = "";
        const cache = /* @__PURE__ */ Object.create(null);
        const { letterSpacing, whiteSpace } = style;
        const collapseSpaces = _CanvasTextMetrics._collapseSpaces(whiteSpace);
        const collapseNewlines = _CanvasTextMetrics._collapseNewlines(whiteSpace);
        let canPrependSpaces = !collapseSpaces;
        const wordWrapWidth = style.wordWrapWidth + letterSpacing;
        const tokens = _CanvasTextMetrics._tokenize(text);
        for(let i = 0; i < tokens.length; i++){
            let token = tokens[i];
            if (_CanvasTextMetrics._isNewline(token)) {
                if (!collapseNewlines) {
                    lines += _CanvasTextMetrics._addLine(line);
                    canPrependSpaces = !collapseSpaces;
                    line = "";
                    width = 0;
                    continue;
                }
                token = " ";
            }
            if (collapseSpaces) {
                const currIsBreakingSpace = _CanvasTextMetrics.isBreakingSpace(token);
                const lastIsBreakingSpace = _CanvasTextMetrics.isBreakingSpace(line[line.length - 1]);
                if (currIsBreakingSpace && lastIsBreakingSpace) {
                    continue;
                }
            }
            const tokenWidth = _CanvasTextMetrics._getFromCache(token, letterSpacing, cache, context);
            if (tokenWidth > wordWrapWidth) {
                if (line !== "") {
                    lines += _CanvasTextMetrics._addLine(line);
                    line = "";
                    width = 0;
                }
                if (_CanvasTextMetrics.canBreakWords(token, style.breakWords)) {
                    const characters = _CanvasTextMetrics.wordWrapSplit(token);
                    for(let j = 0; j < characters.length; j++){
                        let char = characters[j];
                        let lastChar = char;
                        let k = 1;
                        while(characters[j + k]){
                            const nextChar = characters[j + k];
                            if (!_CanvasTextMetrics.canBreakChars(lastChar, nextChar, token, j, style.breakWords)) {
                                char += nextChar;
                            } else {
                                break;
                            }
                            lastChar = nextChar;
                            k++;
                        }
                        j += k - 1;
                        const characterWidth = _CanvasTextMetrics._getFromCache(char, letterSpacing, cache, context);
                        if (characterWidth + width > wordWrapWidth) {
                            lines += _CanvasTextMetrics._addLine(line);
                            canPrependSpaces = false;
                            line = "";
                            width = 0;
                        }
                        line += char;
                        width += characterWidth;
                    }
                } else {
                    if (line.length > 0) {
                        lines += _CanvasTextMetrics._addLine(line);
                        line = "";
                        width = 0;
                    }
                    const isLastToken = i === tokens.length - 1;
                    lines += _CanvasTextMetrics._addLine(token, !isLastToken);
                    canPrependSpaces = false;
                    line = "";
                    width = 0;
                }
            } else {
                if (tokenWidth + width > wordWrapWidth) {
                    canPrependSpaces = false;
                    lines += _CanvasTextMetrics._addLine(line);
                    line = "";
                    width = 0;
                }
                if (line.length > 0 || !_CanvasTextMetrics.isBreakingSpace(token) || canPrependSpaces) {
                    line += token;
                    width += tokenWidth;
                }
            }
        }
        lines += _CanvasTextMetrics._addLine(line, false);
        return lines;
    }
    /**
   * Convenience function for logging each line added during the wordWrap method.
   * @param line    - The line of text to add
   * @param newLine - Add new line character to end
   * @returns A formatted line
   */ static _addLine(line) {
        let newLine = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
        line = _CanvasTextMetrics._trimRight(line);
        line = newLine ? "".concat(line, "\n") : line;
        return line;
    }
    /**
   * Gets & sets the widths of calculated characters in a cache object
   * @param key            - The key
   * @param letterSpacing  - The letter spacing
   * @param cache          - The cache
   * @param context        - The canvas context
   * @returns The from cache.
   */ static _getFromCache(key, letterSpacing, cache, context) {
        let width = cache[key];
        if (typeof width !== "number") {
            width = _CanvasTextMetrics._measureText(key, letterSpacing, context) + letterSpacing;
            cache[key] = width;
        }
        return width;
    }
    /**
   * Determines whether we should collapse breaking spaces.
   * @param whiteSpace - The TextStyle property whiteSpace
   * @returns Should collapse
   */ static _collapseSpaces(whiteSpace) {
        return whiteSpace === "normal" || whiteSpace === "pre-line";
    }
    /**
   * Determines whether we should collapse newLine chars.
   * @param whiteSpace - The white space
   * @returns should collapse
   */ static _collapseNewlines(whiteSpace) {
        return whiteSpace === "normal";
    }
    /**
   * Trims breaking whitespaces from string.
   * @param text - The text
   * @returns Trimmed string
   */ static _trimRight(text) {
        if (typeof text !== "string") {
            return "";
        }
        for(let i = text.length - 1; i >= 0; i--){
            const char = text[i];
            if (!_CanvasTextMetrics.isBreakingSpace(char)) {
                break;
            }
            text = text.slice(0, -1);
        }
        return text;
    }
    /**
   * Determines if char is a newline.
   * @param char - The character
   * @returns True if newline, False otherwise.
   */ static _isNewline(char) {
        if (typeof char !== "string") {
            return false;
        }
        return _CanvasTextMetrics._newlines.includes(char.charCodeAt(0));
    }
    /**
   * Determines if char is a breaking whitespace.
   *
   * It allows one to determine whether char should be a breaking whitespace
   * For example certain characters in CJK langs or numbers.
   * It must return a boolean.
   * @param char - The character
   * @param [_nextChar] - The next character
   * @returns True if whitespace, False otherwise.
   */ static isBreakingSpace(char, _nextChar) {
        if (typeof char !== "string") {
            return false;
        }
        return _CanvasTextMetrics._breakingSpaces.includes(char.charCodeAt(0));
    }
    /**
   * Splits a string into words, breaking-spaces and newLine characters
   * @param text - The text
   * @returns A tokenized array
   */ static _tokenize(text) {
        const tokens = [];
        let token = "";
        if (typeof text !== "string") {
            return tokens;
        }
        for(let i = 0; i < text.length; i++){
            const char = text[i];
            const nextChar = text[i + 1];
            if (_CanvasTextMetrics.isBreakingSpace(char, nextChar) || _CanvasTextMetrics._isNewline(char)) {
                if (token !== "") {
                    tokens.push(token);
                    token = "";
                }
                if (char === "\r" && nextChar === "\n") {
                    tokens.push("\r\n");
                    i++;
                } else {
                    tokens.push(char);
                }
                continue;
            }
            token += char;
        }
        if (token !== "") {
            tokens.push(token);
        }
        return tokens;
    }
    /**
   * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
   *
   * It allows one to customise which words should break
   * Examples are if the token is CJK or numbers.
   * It must return a boolean.
   * @param _token - The token
   * @param breakWords - The style attr break words
   * @returns Whether to break word or not
   */ static canBreakWords(_token, breakWords) {
        return breakWords;
    }
    /**
   * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
   *
   * It allows one to determine whether a pair of characters
   * should be broken by newlines
   * For example certain characters in CJK langs or numbers.
   * It must return a boolean.
   * @param _char - The character
   * @param _nextChar - The next character
   * @param _token - The token/word the characters are from
   * @param _index - The index in the token of the char
   * @param _breakWords - The style attr break words
   * @returns whether to break word or not
   */ static canBreakChars(_char, _nextChar, _token, _index, _breakWords) {
        return true;
    }
    /**
   * Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
   *
   * It is called when a token (usually a word) has to be split into separate pieces
   * in order to determine the point to break a word.
   * It must return an array of characters.
   * @param token - The token to split
   * @returns The characters of the token
   * @see CanvasTextMetrics.graphemeSegmenter
   */ static wordWrapSplit(token) {
        return _CanvasTextMetrics.graphemeSegmenter(token);
    }
    /**
   * Calculates the ascent, descent and fontSize of a given font-style
   * @param font - String representing the style of the font
   * @returns Font properties object
   */ static measureFont(font) {
        if (_CanvasTextMetrics._fonts[font]) {
            return _CanvasTextMetrics._fonts[font];
        }
        const context = _CanvasTextMetrics._context;
        context.font = font;
        const metrics = context.measureText(_CanvasTextMetrics.METRICS_STRING + _CanvasTextMetrics.BASELINE_SYMBOL);
        const properties = {
            ascent: metrics.actualBoundingBoxAscent,
            descent: metrics.actualBoundingBoxDescent,
            fontSize: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        };
        _CanvasTextMetrics._fonts[font] = properties;
        return properties;
    }
    /**
   * Clear font metrics in metrics cache.
   * @param {string} [font] - font name. If font name not set then clear cache for all fonts.
   */ static clearMetrics() {
        let font = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
        if (font) {
            delete _CanvasTextMetrics._fonts[font];
        } else {
            _CanvasTextMetrics._fonts = {};
        }
    }
    /**
   * Cached canvas element for measuring text
   * TODO: this should be private, but isn't because of backward compat, will fix later.
   * @ignore
   */ static get _canvas() {
        if (!_CanvasTextMetrics.__canvas) {
            let canvas;
            try {
                const c = new OffscreenCanvas(0, 0);
                const context = c.getContext("2d", contextSettings);
                if (context === null || context === void 0 ? void 0 : context.measureText) {
                    _CanvasTextMetrics.__canvas = c;
                    return c;
                }
                canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas();
            } catch (_cx) {
                canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas();
            }
            canvas.width = canvas.height = 10;
            _CanvasTextMetrics.__canvas = canvas;
        }
        return _CanvasTextMetrics.__canvas;
    }
    /**
   * TODO: this should be private, but isn't because of backward compat, will fix later.
   * @ignore
   */ static get _context() {
        if (!_CanvasTextMetrics.__context) {
            _CanvasTextMetrics.__context = _CanvasTextMetrics._canvas.getContext("2d", contextSettings);
        }
        return _CanvasTextMetrics.__context;
    }
    /**
   * @param text - the text that was measured
   * @param style - the style that was measured
   * @param width - the measured width of the text
   * @param height - the measured height of the text
   * @param lines - an array of the lines of text broken by new lines and wrapping if specified in style
   * @param lineWidths - an array of the line widths for each line matched to `lines`
   * @param lineHeight - the measured line height for this style
   * @param maxLineWidth - the maximum line width for all measured lines
   * @param {FontMetrics} fontProperties - the font properties object from TextMetrics.measureFont
   */ constructor(text, style, width, height, lines, lineWidths, lineHeight, maxLineWidth, fontProperties){
        this.text = text;
        this.style = style;
        this.width = width;
        this.height = height;
        this.lines = lines;
        this.lineWidths = lineWidths;
        this.lineHeight = lineHeight;
        this.maxLineWidth = maxLineWidth;
        this.fontProperties = fontProperties;
    }
};
/**
 * String used for calculate font metrics.
 * These characters are all tall to help calculate the height required for text.
 */ _CanvasTextMetrics.METRICS_STRING = "|\xC9q\xC5";
/** Baseline symbol for calculate font metrics. */ _CanvasTextMetrics.BASELINE_SYMBOL = "M";
/** Baseline multiplier for calculate font metrics. */ _CanvasTextMetrics.BASELINE_MULTIPLIER = 1.4;
/** Height multiplier for setting height of canvas to calculate font metrics. */ _CanvasTextMetrics.HEIGHT_MULTIPLIER = 2;
/**
 * A Unicode "character", or "grapheme cluster", can be composed of multiple Unicode code points,
 * such as letters with diacritical marks (e.g. `'\u0065\u0301'`, letter e with acute)
 * or emojis with modifiers (e.g. `'\uD83E\uDDD1\u200D\uD83D\uDCBB'`, technologist).
 * The new `Intl.Segmenter` API in ES2022 can split the string into grapheme clusters correctly. If it is not available,
 * PixiJS will fallback to use the iterator of String, which can only spilt the string into code points.
 * If you want to get full functionality in environments that don't support `Intl.Segmenter` (such as Firefox),
 * you can use other libraries such as [grapheme-splitter]{@link https://www.npmjs.com/package/grapheme-splitter}
 * or [graphemer]{@link https://www.npmjs.com/package/graphemer} to create a polyfill. Since these libraries can be
 * relatively large in size to handle various Unicode grapheme clusters properly, PixiJS won't use them directly.
 */ _CanvasTextMetrics.graphemeSegmenter = (()=>{
    var _Intl;
    if (typeof ((_Intl = Intl) === null || _Intl === void 0 ? void 0 : _Intl.Segmenter) === "function") {
        const segmenter = new Intl.Segmenter();
        return (s)=>{
            const segments = segmenter.segment(s);
            const result = [];
            let i = 0;
            for (const segment of segments){
                result[i++] = segment.segment;
            }
            return result;
        };
    }
    return (s)=>[
            ...s
        ];
})();
/**
 * New rendering behavior for letter-spacing which uses Chrome's new native API. This will
 * lead to more accurate letter-spacing results because it does not try to manually draw
 * each character. However, this Chrome API is experimental and may not serve all cases yet.
 * @see TextMetrics.experimentalLetterSpacingSupported
 */ _CanvasTextMetrics.experimentalLetterSpacing = false;
/** Cache of {@link TextMetrics.FontMetrics} objects. */ _CanvasTextMetrics._fonts = {};
/** Cache of new line chars. */ _CanvasTextMetrics._newlines = [
    10,
    // line feed
    13
];
/** Cache of breaking spaces. */ _CanvasTextMetrics._breakingSpaces = [
    9,
    // character tabulation
    32,
    // space
    8192,
    // en quad
    8193,
    // em quad
    8194,
    // en space
    8195,
    // em space
    8196,
    // three-per-em space
    8197,
    // four-per-em space
    8198,
    // six-per-em space
    8200,
    // punctuation space
    8201,
    // thin space
    8202,
    // hair space
    8287,
    // medium mathematical space
    12288
];
/** Cache for measured text metrics */ _CanvasTextMetrics._measurementCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tiny$2d$lru$40$11$2e$4$2e$5$2f$node_modules$2f$tiny$2d$lru$2f$dist$2f$tiny$2d$lru$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lru"])(1e3);
let CanvasTextMetrics = _CanvasTextMetrics;
;
 //# sourceMappingURL=CanvasTextMetrics.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/fill/FillGradient.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FillGradient",
    ()=>FillGradient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$ImageSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/ImageSource.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$definedProps$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/definedProps.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
"use strict";
const emptyColorStops = [
    {
        offset: 0,
        color: "white"
    },
    {
        offset: 1,
        color: "black"
    }
];
const _FillGradient = class _FillGradient {
    /**
   * Adds a color stop to the gradient
   * @param offset - Position of the stop (0-1)
   * @param color - Color of the stop
   * @returns This gradient instance for chaining
   */ addColorStop(offset, color) {
        this.colorStops.push({
            offset,
            color: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(color).toHexa()
        });
        return this;
    }
    /**
   * Builds the internal texture and transform for the gradient.
   * Called automatically when the gradient is first used.
   * @internal
   */ buildLinearGradient() {
        if (this.texture) return;
        let { x: x0, y: y0 } = this.start;
        let { x: x1, y: y1 } = this.end;
        let dx = x1 - x0;
        let dy = y1 - y0;
        const flip = dx < 0 || dy < 0;
        if (this._wrapMode === "clamp-to-edge") {
            if (dx < 0) {
                const temp = x0;
                x0 = x1;
                x1 = temp;
                dx *= -1;
            }
            if (dy < 0) {
                const temp = y0;
                y0 = y1;
                y1 = temp;
                dy *= -1;
            }
        }
        const colorStops = this.colorStops.length ? this.colorStops : emptyColorStops;
        const defaultSize = this._textureSize;
        const { canvas, context } = getCanvas(defaultSize, 1);
        const gradient = !flip ? context.createLinearGradient(0, 0, this._textureSize, 0) : context.createLinearGradient(this._textureSize, 0, 0, 0);
        addColorStops(gradient, colorStops);
        context.fillStyle = gradient;
        context.fillRect(0, 0, defaultSize, 1);
        this.texture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]({
            source: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$ImageSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ImageSource"]({
                resource: canvas,
                addressMode: this._wrapMode
            })
        });
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
        m.scale(dist / defaultSize, 1);
        m.rotate(angle);
        m.translate(x0, y0);
        if (this.textureSpace === "local") {
            m.scale(defaultSize, defaultSize);
        }
        this.transform = m;
    }
    /**
   * Builds the internal texture and transform for the gradient.
   * Called automatically when the gradient is first used.
   * @internal
   */ buildGradient() {
        if (!this.texture) this._tick++;
        if (this.type === "linear") {
            this.buildLinearGradient();
        } else {
            this.buildRadialGradient();
        }
    }
    /**
   * Builds the internal texture and transform for the radial gradient.
   * Called automatically when the gradient is first used.
   * @internal
   */ buildRadialGradient() {
        if (this.texture) return;
        const colorStops = this.colorStops.length ? this.colorStops : emptyColorStops;
        const defaultSize = this._textureSize;
        const { canvas, context } = getCanvas(defaultSize, defaultSize);
        const { x: x0, y: y0 } = this.center;
        const { x: x1, y: y1 } = this.outerCenter;
        const r0 = this.innerRadius;
        const r1 = this.outerRadius;
        const ox = x1 - r1;
        const oy = y1 - r1;
        const scale = defaultSize / (r1 * 2);
        const cx = (x0 - ox) * scale;
        const cy = (y0 - oy) * scale;
        const gradient = context.createRadialGradient(cx, cy, r0 * scale, (x1 - ox) * scale, (y1 - oy) * scale, r1 * scale);
        addColorStops(gradient, colorStops);
        context.fillStyle = colorStops[colorStops.length - 1].color;
        context.fillRect(0, 0, defaultSize, defaultSize);
        context.fillStyle = gradient;
        context.translate(cx, cy);
        context.rotate(this.rotation);
        context.scale(1, this.scale);
        context.translate(-cx, -cy);
        context.fillRect(0, 0, defaultSize, defaultSize);
        this.texture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]({
            source: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$ImageSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ImageSource"]({
                resource: canvas,
                addressMode: this._wrapMode
            })
        });
        const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
        m.scale(1 / scale, 1 / scale);
        m.translate(ox, oy);
        if (this.textureSpace === "local") {
            m.scale(defaultSize, defaultSize);
        }
        this.transform = m;
    }
    /** Destroys the gradient, releasing resources. This will also destroy the internal texture. */ destroy() {
        var _this_texture;
        (_this_texture = this.texture) === null || _this_texture === void 0 ? void 0 : _this_texture.destroy(true);
        this.texture = null;
        this.transform = null;
        this.colorStops = [];
        this.start = null;
        this.end = null;
        this.center = null;
        this.outerCenter = null;
    }
    /**
   * Returns a unique key for this gradient instance.
   * This key is used for caching and texture management.
   * @returns {string} Unique key for the gradient
   */ get styleKey() {
        return "fill-gradient-".concat(this.uid, "-").concat(this._tick);
    }
    constructor(...args){
        /**
     * Unique identifier for this gradient instance
     * @internal
     */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("fillGradient");
        /**
     * Internal tick counter to track changes in the gradient.
     * This is used to invalidate the gradient when the texture changes.
     * @internal
     */ this._tick = 0;
        /** Type of gradient - currently only supports 'linear' */ this.type = "linear";
        /** Array of color stops defining the gradient */ this.colorStops = [];
        let options = ensureGradientOptions(args);
        const defaults = options.type === "radial" ? _FillGradient.defaultRadialOptions : _FillGradient.defaultLinearOptions;
        options = {
            ...defaults,
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$definedProps$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["definedProps"])(options)
        };
        this._textureSize = options.textureSize;
        this._wrapMode = options.wrapMode;
        if (options.type === "radial") {
            this.center = options.center;
            var _options_outerCenter;
            this.outerCenter = (_options_outerCenter = options.outerCenter) !== null && _options_outerCenter !== void 0 ? _options_outerCenter : this.center;
            this.innerRadius = options.innerRadius;
            this.outerRadius = options.outerRadius;
            this.scale = options.scale;
            this.rotation = options.rotation;
        } else {
            this.start = options.start;
            this.end = options.end;
        }
        this.textureSpace = options.textureSpace;
        this.type = options.type;
        options.colorStops.forEach((stop)=>{
            this.addColorStop(stop.offset, stop.color);
        });
    }
};
/** Default options for creating a gradient fill */ _FillGradient.defaultLinearOptions = {
    start: {
        x: 0,
        y: 0
    },
    end: {
        x: 0,
        y: 1
    },
    colorStops: [],
    textureSpace: "local",
    type: "linear",
    textureSize: 256,
    wrapMode: "clamp-to-edge"
};
/** Default options for creating a radial gradient fill */ _FillGradient.defaultRadialOptions = {
    center: {
        x: 0.5,
        y: 0.5
    },
    innerRadius: 0,
    outerRadius: 0.5,
    colorStops: [],
    scale: 1,
    textureSpace: "local",
    type: "radial",
    textureSize: 256,
    wrapMode: "clamp-to-edge"
};
let FillGradient = _FillGradient;
function addColorStops(gradient, colorStops) {
    for(let i = 0; i < colorStops.length; i++){
        const stop = colorStops[i];
        gradient.addColorStop(stop.offset, stop.color);
    }
}
function getCanvas(width, height) {
    const canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas(width, height);
    const context = canvas.getContext("2d");
    return {
        canvas,
        context
    };
}
function ensureGradientOptions(args) {
    var _args_;
    let options = (_args_ = args[0]) !== null && _args_ !== void 0 ? _args_ : {};
    if (typeof options === "number" || args[1]) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])("8.5.2", "use options object instead");
        var _args_1;
        options = {
            type: "linear",
            start: {
                x: args[0],
                y: args[1]
            },
            end: {
                x: args[2],
                y: args[3]
            },
            textureSpace: args[4],
            textureSize: (_args_1 = args[5]) !== null && _args_1 !== void 0 ? _args_1 : FillGradient.defaultLinearOptions.textureSize
        };
    }
    return options;
}
;
 //# sourceMappingURL=FillGradient.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/fill/FillPattern.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FillPattern",
    ()=>FillPattern
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
;
;
"use strict";
const repetitionMap = {
    repeat: {
        addressModeU: "repeat",
        addressModeV: "repeat"
    },
    "repeat-x": {
        addressModeU: "repeat",
        addressModeV: "clamp-to-edge"
    },
    "repeat-y": {
        addressModeU: "clamp-to-edge",
        addressModeV: "repeat"
    },
    "no-repeat": {
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge"
    }
};
class FillPattern {
    /**
   * Sets the transform for the pattern
   * @param transform - The transform matrix to apply to the pattern.
   * If not provided, the pattern will use the default transform.
   */ setTransform(transform) {
        const texture = this.texture;
        this.transform.copyFrom(transform);
        this.transform.invert();
        this.transform.scale(1 / texture.frame.width, 1 / texture.frame.height);
        this._tick++;
    }
    /** Internal texture used to render the gradient */ get texture() {
        return this._texture;
    }
    set texture(value) {
        if (this._texture === value) return;
        this._texture = value;
        this._tick++;
    }
    /**
   * Returns a unique key for this instance.
   * This key is used for caching.
   * @returns {string} Unique key for the instance
   */ get styleKey() {
        return "fill-pattern-".concat(this.uid, "-").concat(this._tick);
    }
    /** Destroys the fill pattern, releasing resources. This will also destroy the internal texture. */ destroy() {
        this.texture.destroy(true);
        this.texture = null;
    }
    constructor(texture, repetition){
        /**
     * unique id for this fill pattern
     * @internal
     */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("fillPattern");
        /**
     * Internal tick counter to track changes in the pattern.
     * This is used to invalidate the pattern when the texture or transform changes.
     * @internal
     */ this._tick = 0;
        /** The transform matrix applied to the pattern */ this.transform = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
        this.texture = texture;
        this.transform.scale(1 / texture.frame.width, 1 / texture.frame.height);
        if (repetition) {
            texture.source.style.addressModeU = repetitionMap[repetition].addressModeU;
            texture.source.style.addressModeV = repetitionMap[repetition].addressModeV;
        }
    }
}
;
 //# sourceMappingURL=FillPattern.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/parseSVGPath.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseSVGPath",
    ()=>parseSVGPath
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$parse$2d$svg$2d$path$40$0$2e$1$2e$2$2f$node_modules$2f$parse$2d$svg$2d$path$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/parse-svg-path@0.1.2/node_modules/parse-svg-path/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-client] (ecmascript)");
;
;
"use strict";
function parseSVGPath(svgPath, path) {
    const commands = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$parse$2d$svg$2d$path$40$0$2e$1$2e$2$2f$node_modules$2f$parse$2d$svg$2d$path$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(svgPath);
    const subpaths = [];
    let currentSubPath = null;
    let lastX = 0;
    let lastY = 0;
    for(let i = 0; i < commands.length; i++){
        const command = commands[i];
        const type = command[0];
        const data = command;
        switch(type){
            case "M":
                lastX = data[1];
                lastY = data[2];
                path.moveTo(lastX, lastY);
                break;
            case "m":
                lastX += data[1];
                lastY += data[2];
                path.moveTo(lastX, lastY);
                break;
            case "H":
                lastX = data[1];
                path.lineTo(lastX, lastY);
                break;
            case "h":
                lastX += data[1];
                path.lineTo(lastX, lastY);
                break;
            case "V":
                lastY = data[1];
                path.lineTo(lastX, lastY);
                break;
            case "v":
                lastY += data[1];
                path.lineTo(lastX, lastY);
                break;
            case "L":
                lastX = data[1];
                lastY = data[2];
                path.lineTo(lastX, lastY);
                break;
            case "l":
                lastX += data[1];
                lastY += data[2];
                path.lineTo(lastX, lastY);
                break;
            case "C":
                lastX = data[5];
                lastY = data[6];
                path.bezierCurveTo(data[1], data[2], // First control point
                data[3], data[4], // Second control point
                lastX, lastY);
                break;
            case "c":
                path.bezierCurveTo(lastX + data[1], lastY + data[2], // First control point
                lastX + data[3], lastY + data[4], // Second control point
                lastX + data[5], lastY + data[6]);
                lastX += data[5];
                lastY += data[6];
                break;
            case "S":
                lastX = data[3];
                lastY = data[4];
                path.bezierCurveToShort(data[1], data[2], // Control point
                lastX, lastY);
                break;
            case "s":
                path.bezierCurveToShort(lastX + data[1], lastY + data[2], // Control point
                lastX + data[3], lastY + data[4]);
                lastX += data[3];
                lastY += data[4];
                break;
            case "Q":
                lastX = data[3];
                lastY = data[4];
                path.quadraticCurveTo(data[1], data[2], // Control point
                lastX, lastY);
                break;
            case "q":
                path.quadraticCurveTo(lastX + data[1], lastY + data[2], // Control point
                lastX + data[3], lastY + data[4]);
                lastX += data[3];
                lastY += data[4];
                break;
            case "T":
                lastX = data[1];
                lastY = data[2];
                path.quadraticCurveToShort(lastX, lastY);
                break;
            case "t":
                lastX += data[1];
                lastY += data[2];
                path.quadraticCurveToShort(lastX, lastY);
                break;
            case "A":
                lastX = data[6];
                lastY = data[7];
                path.arcToSvg(data[1], // rx
                data[2], // ry
                data[3], // x-axis-rotation
                data[4], // large-arc-flag
                data[5], // sweep-flag
                lastX, lastY);
                break;
            case "a":
                lastX += data[6];
                lastY += data[7];
                path.arcToSvg(data[1], // rx
                data[2], // ry
                data[3], // x-axis-rotation
                data[4], // large-arc-flag
                data[5], // sweep-flag
                lastX, lastY);
                break;
            case "Z":
            case "z":
                path.closePath();
                if (subpaths.length > 0) {
                    currentSubPath = subpaths.pop();
                    if (currentSubPath) {
                        lastX = currentSubPath.startX;
                        lastY = currentSubPath.startY;
                    } else {
                        lastX = 0;
                        lastY = 0;
                    }
                }
                currentSubPath = null;
                break;
            default:
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])("Unknown SVG path command: ".concat(type));
        }
        if (type !== "Z" && type !== "z") {
            if (currentSubPath === null) {
                currentSubPath = {
                    startX: lastX,
                    startY: lastY
                };
                subpaths.push(currentSubPath);
            }
        }
    }
    return path;
}
;
 //# sourceMappingURL=parseSVGPath.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/BatchableGraphics.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchableGraphics",
    ()=>BatchableGraphics
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyHexColors$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/multiplyHexColors.mjs [app-client] (ecmascript)");
;
;
"use strict";
const identityMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
class BatchableGraphics {
    get uvs() {
        return this.geometryData.uvs;
    }
    get positions() {
        return this.geometryData.vertices;
    }
    get indices() {
        return this.geometryData.indices;
    }
    get blendMode() {
        if (this.renderable && this.applyTransform) {
            return this.renderable.groupBlendMode;
        }
        return "normal";
    }
    get color() {
        const rgb = this.baseColor;
        const bgr = rgb >> 16 | rgb & 65280 | (rgb & 255) << 16;
        const renderable = this.renderable;
        if (renderable) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyHexColors$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["multiplyHexColors"])(bgr, renderable.groupColor) + (this.alpha * renderable.groupAlpha * 255 << 24);
        }
        return bgr + (this.alpha * 255 << 24);
    }
    get transform() {
        var _this_renderable;
        return ((_this_renderable = this.renderable) === null || _this_renderable === void 0 ? void 0 : _this_renderable.groupTransform) || identityMatrix;
    }
    copyTo(gpuBuffer) {
        gpuBuffer.indexOffset = this.indexOffset;
        gpuBuffer.indexSize = this.indexSize;
        gpuBuffer.attributeOffset = this.attributeOffset;
        gpuBuffer.attributeSize = this.attributeSize;
        gpuBuffer.baseColor = this.baseColor;
        gpuBuffer.alpha = this.alpha;
        gpuBuffer.texture = this.texture;
        gpuBuffer.geometryData = this.geometryData;
        gpuBuffer.topology = this.topology;
    }
    reset() {
        this.applyTransform = true;
        this.renderable = null;
        this.topology = "triangle-list";
    }
    destroy() {
        this.renderable = null;
        this.texture = null;
        this.geometryData = null;
        this._batcher.destroy();
        this._batcher = null;
        this._batch.destroy();
        this._batch = null;
    }
    constructor(){
        this.packAsQuad = false;
        this.batcherName = "default";
        this.topology = "triangle-list";
        this.applyTransform = true;
        this.roundPixels = 0;
        this._batcher = null;
        this._batch = null;
    }
}
;
 //# sourceMappingURL=BatchableGraphics.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildCircle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildCircle",
    ()=>buildCircle,
    "buildEllipse",
    ()=>buildEllipse,
    "buildRoundedRectangle",
    ()=>buildRoundedRectangle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
;
"use strict";
const buildCircle = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].ShapeBuilder,
        name: "circle"
    },
    build (shape, points) {
        let x;
        let y;
        let dx;
        let dy;
        let rx;
        let ry;
        if (shape.type === "circle") {
            const circle = shape;
            rx = ry = circle.radius;
            if (rx <= 0) {
                return false;
            }
            x = circle.x;
            y = circle.y;
            dx = dy = 0;
        } else if (shape.type === "ellipse") {
            const ellipse = shape;
            rx = ellipse.halfWidth;
            ry = ellipse.halfHeight;
            if (rx <= 0 || ry <= 0) {
                return false;
            }
            x = ellipse.x;
            y = ellipse.y;
            dx = dy = 0;
        } else {
            const roundedRect = shape;
            const halfWidth = roundedRect.width / 2;
            const halfHeight = roundedRect.height / 2;
            x = roundedRect.x + halfWidth;
            y = roundedRect.y + halfHeight;
            rx = ry = Math.max(0, Math.min(roundedRect.radius, Math.min(halfWidth, halfHeight)));
            dx = halfWidth - rx;
            dy = halfHeight - ry;
        }
        if (dx < 0 || dy < 0) {
            return false;
        }
        const n = Math.ceil(2.3 * Math.sqrt(rx + ry));
        const m = n * 8 + (dx ? 4 : 0) + (dy ? 4 : 0);
        if (m === 0) {
            return false;
        }
        if (n === 0) {
            points[0] = points[6] = x + dx;
            points[1] = points[3] = y + dy;
            points[2] = points[4] = x - dx;
            points[5] = points[7] = y - dy;
            return true;
        }
        let j1 = 0;
        let j2 = n * 4 + (dx ? 2 : 0) + 2;
        let j3 = j2;
        let j4 = m;
        let x0 = dx + rx;
        let y0 = dy;
        let x1 = x + x0;
        let x2 = x - x0;
        let y1 = y + y0;
        points[j1++] = x1;
        points[j1++] = y1;
        points[--j2] = y1;
        points[--j2] = x2;
        if (dy) {
            const y22 = y - y0;
            points[j3++] = x2;
            points[j3++] = y22;
            points[--j4] = y22;
            points[--j4] = x1;
        }
        for(let i = 1; i < n; i++){
            const a = Math.PI / 2 * (i / n);
            const x02 = dx + Math.cos(a) * rx;
            const y02 = dy + Math.sin(a) * ry;
            const x12 = x + x02;
            const x22 = x - x02;
            const y12 = y + y02;
            const y22 = y - y02;
            points[j1++] = x12;
            points[j1++] = y12;
            points[--j2] = y12;
            points[--j2] = x22;
            points[j3++] = x22;
            points[j3++] = y22;
            points[--j4] = y22;
            points[--j4] = x12;
        }
        x0 = dx;
        y0 = dy + ry;
        x1 = x + x0;
        x2 = x - x0;
        y1 = y + y0;
        const y2 = y - y0;
        points[j1++] = x1;
        points[j1++] = y1;
        points[--j4] = y2;
        points[--j4] = x1;
        if (dx) {
            points[j1++] = x2;
            points[j1++] = y1;
            points[--j4] = y2;
            points[--j4] = x2;
        }
        return true;
    },
    triangulate (points, vertices, verticesStride, verticesOffset, indices, indicesOffset) {
        if (points.length === 0) {
            return;
        }
        let centerX = 0;
        let centerY = 0;
        for(let i = 0; i < points.length; i += 2){
            centerX += points[i];
            centerY += points[i + 1];
        }
        centerX /= points.length / 2;
        centerY /= points.length / 2;
        let count = verticesOffset;
        vertices[count * verticesStride] = centerX;
        vertices[count * verticesStride + 1] = centerY;
        const centerIndex = count++;
        for(let i = 0; i < points.length; i += 2){
            vertices[count * verticesStride] = points[i];
            vertices[count * verticesStride + 1] = points[i + 1];
            if (i > 0) {
                indices[indicesOffset++] = count;
                indices[indicesOffset++] = centerIndex;
                indices[indicesOffset++] = count - 1;
            }
            count++;
        }
        indices[indicesOffset++] = centerIndex + 1;
        indices[indicesOffset++] = centerIndex;
        indices[indicesOffset++] = count - 1;
    }
};
const buildEllipse = {
    ...buildCircle,
    extension: {
        ...buildCircle.extension,
        name: "ellipse"
    }
};
const buildRoundedRectangle = {
    ...buildCircle,
    extension: {
        ...buildCircle.extension,
        name: "roundedRectangle"
    }
};
;
 //# sourceMappingURL=buildCircle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/const.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "closePointEps",
    ()=>closePointEps,
    "curveEps",
    ()=>curveEps
]);
"use strict";
const closePointEps = 1e-4;
const curveEps = 1e-4;
;
 //# sourceMappingURL=const.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/getOrientationOfPoints.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getOrientationOfPoints",
    ()=>getOrientationOfPoints
]);
"use strict";
function getOrientationOfPoints(points) {
    const m = points.length;
    if (m < 6) {
        return 1;
    }
    let area = 0;
    for(let i = 0, x1 = points[m - 2], y1 = points[m - 1]; i < m; i += 2){
        const x2 = points[i];
        const y2 = points[i + 1];
        area += (x2 - x1) * (y2 + y1);
        x1 = x2;
        y1 = y2;
    }
    if (area < 0) {
        return -1;
    }
    return 1;
}
;
 //# sourceMappingURL=getOrientationOfPoints.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildLine.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildLine",
    ()=>buildLine
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/Point.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/const.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$getOrientationOfPoints$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/getOrientationOfPoints.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
function square(x, y, nx, ny, innerWeight, outerWeight, clockwise, verts) {
    const ix = x - nx * innerWeight;
    const iy = y - ny * innerWeight;
    const ox = x + nx * outerWeight;
    const oy = y + ny * outerWeight;
    let exx;
    let eyy;
    if (clockwise) {
        exx = ny;
        eyy = -nx;
    } else {
        exx = -ny;
        eyy = nx;
    }
    const eix = ix + exx;
    const eiy = iy + eyy;
    const eox = ox + exx;
    const eoy = oy + eyy;
    verts.push(eix, eiy);
    verts.push(eox, eoy);
    return 2;
}
function round(cx, cy, sx, sy, ex, ey, verts, clockwise) {
    const cx2p0x = sx - cx;
    const cy2p0y = sy - cy;
    let angle0 = Math.atan2(cx2p0x, cy2p0y);
    let angle1 = Math.atan2(ex - cx, ey - cy);
    if (clockwise && angle0 < angle1) {
        angle0 += Math.PI * 2;
    } else if (!clockwise && angle0 > angle1) {
        angle1 += Math.PI * 2;
    }
    let startAngle = angle0;
    const angleDiff = angle1 - angle0;
    const absAngleDiff = Math.abs(angleDiff);
    const radius = Math.sqrt(cx2p0x * cx2p0x + cy2p0y * cy2p0y);
    const segCount = (15 * absAngleDiff * Math.sqrt(radius) / Math.PI >> 0) + 1;
    const angleInc = angleDiff / segCount;
    startAngle += angleInc;
    if (clockwise) {
        verts.push(cx, cy);
        verts.push(sx, sy);
        for(let i = 1, angle = startAngle; i < segCount; i++, angle += angleInc){
            verts.push(cx, cy);
            verts.push(cx + Math.sin(angle) * radius, cy + Math.cos(angle) * radius);
        }
        verts.push(cx, cy);
        verts.push(ex, ey);
    } else {
        verts.push(sx, sy);
        verts.push(cx, cy);
        for(let i = 1, angle = startAngle; i < segCount; i++, angle += angleInc){
            verts.push(cx + Math.sin(angle) * radius, cy + Math.cos(angle) * radius);
            verts.push(cx, cy);
        }
        verts.push(ex, ey);
        verts.push(cx, cy);
    }
    return segCount * 2;
}
function buildLine(points, lineStyle, flipAlignment, closed, vertices, indices) {
    const eps = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["closePointEps"];
    if (points.length === 0) {
        return;
    }
    const style = lineStyle;
    let alignment = style.alignment;
    if (lineStyle.alignment !== 0.5) {
        let orientation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$getOrientationOfPoints$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getOrientationOfPoints"])(points);
        if (flipAlignment) orientation *= -1;
        alignment = (alignment - 0.5) * orientation + 0.5;
    }
    const firstPoint = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"](points[0], points[1]);
    const lastPoint = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"](points[points.length - 2], points[points.length - 1]);
    const closedShape = closed;
    const closedPath = Math.abs(firstPoint.x - lastPoint.x) < eps && Math.abs(firstPoint.y - lastPoint.y) < eps;
    if (closedShape) {
        points = points.slice();
        if (closedPath) {
            points.pop();
            points.pop();
            lastPoint.set(points[points.length - 2], points[points.length - 1]);
        }
        const midPointX = (firstPoint.x + lastPoint.x) * 0.5;
        const midPointY = (lastPoint.y + firstPoint.y) * 0.5;
        points.unshift(midPointX, midPointY);
        points.push(midPointX, midPointY);
    }
    const verts = vertices;
    const length = points.length / 2;
    let indexCount = points.length;
    const indexStart = verts.length / 2;
    const width = style.width / 2;
    const widthSquared = width * width;
    const miterLimitSquared = style.miterLimit * style.miterLimit;
    let x0 = points[0];
    let y0 = points[1];
    let x1 = points[2];
    let y1 = points[3];
    let x2 = 0;
    let y2 = 0;
    let perpX = -(y0 - y1);
    let perpY = x0 - x1;
    let perp1x = 0;
    let perp1y = 0;
    let dist = Math.sqrt(perpX * perpX + perpY * perpY);
    perpX /= dist;
    perpY /= dist;
    perpX *= width;
    perpY *= width;
    const ratio = alignment;
    const innerWeight = (1 - ratio) * 2;
    const outerWeight = ratio * 2;
    if (!closedShape) {
        if (style.cap === "round") {
            indexCount += round(x0 - perpX * (innerWeight - outerWeight) * 0.5, y0 - perpY * (innerWeight - outerWeight) * 0.5, x0 - perpX * innerWeight, y0 - perpY * innerWeight, x0 + perpX * outerWeight, y0 + perpY * outerWeight, verts, true) + 2;
        } else if (style.cap === "square") {
            indexCount += square(x0, y0, perpX, perpY, innerWeight, outerWeight, true, verts);
        }
    }
    verts.push(x0 - perpX * innerWeight, y0 - perpY * innerWeight);
    verts.push(x0 + perpX * outerWeight, y0 + perpY * outerWeight);
    for(let i = 1; i < length - 1; ++i){
        x0 = points[(i - 1) * 2];
        y0 = points[(i - 1) * 2 + 1];
        x1 = points[i * 2];
        y1 = points[i * 2 + 1];
        x2 = points[(i + 1) * 2];
        y2 = points[(i + 1) * 2 + 1];
        perpX = -(y0 - y1);
        perpY = x0 - x1;
        dist = Math.sqrt(perpX * perpX + perpY * perpY);
        perpX /= dist;
        perpY /= dist;
        perpX *= width;
        perpY *= width;
        perp1x = -(y1 - y2);
        perp1y = x1 - x2;
        dist = Math.sqrt(perp1x * perp1x + perp1y * perp1y);
        perp1x /= dist;
        perp1y /= dist;
        perp1x *= width;
        perp1y *= width;
        const dx0 = x1 - x0;
        const dy0 = y0 - y1;
        const dx1 = x1 - x2;
        const dy1 = y2 - y1;
        const dot = dx0 * dx1 + dy0 * dy1;
        const cross = dy0 * dx1 - dy1 * dx0;
        const clockwise = cross < 0;
        if (Math.abs(cross) < 1e-3 * Math.abs(dot)) {
            verts.push(x1 - perpX * innerWeight, y1 - perpY * innerWeight);
            verts.push(x1 + perpX * outerWeight, y1 + perpY * outerWeight);
            if (dot >= 0) {
                if (style.join === "round") {
                    indexCount += round(x1, y1, x1 - perpX * innerWeight, y1 - perpY * innerWeight, x1 - perp1x * innerWeight, y1 - perp1y * innerWeight, verts, false) + 4;
                } else {
                    indexCount += 2;
                }
                verts.push(x1 - perp1x * outerWeight, y1 - perp1y * outerWeight);
                verts.push(x1 + perp1x * innerWeight, y1 + perp1y * innerWeight);
            }
            continue;
        }
        const c1 = (-perpX + x0) * (-perpY + y1) - (-perpX + x1) * (-perpY + y0);
        const c2 = (-perp1x + x2) * (-perp1y + y1) - (-perp1x + x1) * (-perp1y + y2);
        const px = (dx0 * c2 - dx1 * c1) / cross;
        const py = (dy1 * c1 - dy0 * c2) / cross;
        const pDist = (px - x1) * (px - x1) + (py - y1) * (py - y1);
        const imx = x1 + (px - x1) * innerWeight;
        const imy = y1 + (py - y1) * innerWeight;
        const omx = x1 - (px - x1) * outerWeight;
        const omy = y1 - (py - y1) * outerWeight;
        const smallerInsideSegmentSq = Math.min(dx0 * dx0 + dy0 * dy0, dx1 * dx1 + dy1 * dy1);
        const insideWeight = clockwise ? innerWeight : outerWeight;
        const smallerInsideDiagonalSq = smallerInsideSegmentSq + insideWeight * insideWeight * widthSquared;
        const insideMiterOk = pDist <= smallerInsideDiagonalSq;
        if (insideMiterOk) {
            if (style.join === "bevel" || pDist / widthSquared > miterLimitSquared) {
                if (clockwise) {
                    verts.push(imx, imy);
                    verts.push(x1 + perpX * outerWeight, y1 + perpY * outerWeight);
                    verts.push(imx, imy);
                    verts.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight);
                } else {
                    verts.push(x1 - perpX * innerWeight, y1 - perpY * innerWeight);
                    verts.push(omx, omy);
                    verts.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight);
                    verts.push(omx, omy);
                }
                indexCount += 2;
            } else if (style.join === "round") {
                if (clockwise) {
                    verts.push(imx, imy);
                    verts.push(x1 + perpX * outerWeight, y1 + perpY * outerWeight);
                    indexCount += round(x1, y1, x1 + perpX * outerWeight, y1 + perpY * outerWeight, x1 + perp1x * outerWeight, y1 + perp1y * outerWeight, verts, true) + 4;
                    verts.push(imx, imy);
                    verts.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight);
                } else {
                    verts.push(x1 - perpX * innerWeight, y1 - perpY * innerWeight);
                    verts.push(omx, omy);
                    indexCount += round(x1, y1, x1 - perpX * innerWeight, y1 - perpY * innerWeight, x1 - perp1x * innerWeight, y1 - perp1y * innerWeight, verts, false) + 4;
                    verts.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight);
                    verts.push(omx, omy);
                }
            } else {
                verts.push(imx, imy);
                verts.push(omx, omy);
            }
        } else {
            verts.push(x1 - perpX * innerWeight, y1 - perpY * innerWeight);
            verts.push(x1 + perpX * outerWeight, y1 + perpY * outerWeight);
            if (style.join === "round") {
                if (clockwise) {
                    indexCount += round(x1, y1, x1 + perpX * outerWeight, y1 + perpY * outerWeight, x1 + perp1x * outerWeight, y1 + perp1y * outerWeight, verts, true) + 2;
                } else {
                    indexCount += round(x1, y1, x1 - perpX * innerWeight, y1 - perpY * innerWeight, x1 - perp1x * innerWeight, y1 - perp1y * innerWeight, verts, false) + 2;
                }
            } else if (style.join === "miter" && pDist / widthSquared <= miterLimitSquared) {
                if (clockwise) {
                    verts.push(omx, omy);
                    verts.push(omx, omy);
                } else {
                    verts.push(imx, imy);
                    verts.push(imx, imy);
                }
                indexCount += 2;
            }
            verts.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight);
            verts.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight);
            indexCount += 2;
        }
    }
    x0 = points[(length - 2) * 2];
    y0 = points[(length - 2) * 2 + 1];
    x1 = points[(length - 1) * 2];
    y1 = points[(length - 1) * 2 + 1];
    perpX = -(y0 - y1);
    perpY = x0 - x1;
    dist = Math.sqrt(perpX * perpX + perpY * perpY);
    perpX /= dist;
    perpY /= dist;
    perpX *= width;
    perpY *= width;
    verts.push(x1 - perpX * innerWeight, y1 - perpY * innerWeight);
    verts.push(x1 + perpX * outerWeight, y1 + perpY * outerWeight);
    if (!closedShape) {
        if (style.cap === "round") {
            indexCount += round(x1 - perpX * (innerWeight - outerWeight) * 0.5, y1 - perpY * (innerWeight - outerWeight) * 0.5, x1 - perpX * innerWeight, y1 - perpY * innerWeight, x1 + perpX * outerWeight, y1 + perpY * outerWeight, verts, false) + 2;
        } else if (style.cap === "square") {
            indexCount += square(x1, y1, perpX, perpY, innerWeight, outerWeight, false, verts);
        }
    }
    const eps2 = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["curveEps"] * __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["curveEps"];
    for(let i = indexStart; i < indexCount + indexStart - 2; ++i){
        x0 = verts[i * 2];
        y0 = verts[i * 2 + 1];
        x1 = verts[(i + 1) * 2];
        y1 = verts[(i + 1) * 2 + 1];
        x2 = verts[(i + 2) * 2];
        y2 = verts[(i + 2) * 2 + 1];
        if (Math.abs(x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1)) < eps2) {
            continue;
        }
        indices.push(i, i + 1, i + 2);
    }
}
;
 //# sourceMappingURL=buildLine.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildPixelLine.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildPixelLine",
    ()=>buildPixelLine
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/const.mjs [app-client] (ecmascript)");
;
"use strict";
function buildPixelLine(points, closed, vertices, indices) {
    const eps = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$const$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["closePointEps"];
    if (points.length === 0) {
        return;
    }
    const fx = points[0];
    const fy = points[1];
    const lx = points[points.length - 2];
    const ly = points[points.length - 1];
    const closePath = closed || Math.abs(fx - lx) < eps && Math.abs(fy - ly) < eps;
    const verts = vertices;
    const length = points.length / 2;
    const indexStart = verts.length / 2;
    for(let i = 0; i < length; i++){
        verts.push(points[i * 2]);
        verts.push(points[i * 2 + 1]);
    }
    for(let i = 0; i < length - 1; i++){
        indices.push(indexStart + i, indexStart + i + 1);
    }
    if (closePath) {
        indices.push(indexStart + length - 1, indexStart);
    }
}
;
 //# sourceMappingURL=buildPixelLine.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/triangulateWithHoles.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "triangulateWithHoles",
    ()=>triangulateWithHoles
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$utils$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/utils.mjs [app-client] (ecmascript) <locals>");
;
"use strict";
function triangulateWithHoles(points, holes, vertices, verticesStride, verticesOffset, indices, indicesOffset) {
    const triangles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$utils$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["earcut"])(points, holes, 2);
    if (!triangles) {
        return;
    }
    for(let i = 0; i < triangles.length; i += 3){
        indices[indicesOffset++] = triangles[i] + verticesOffset;
        indices[indicesOffset++] = triangles[i + 1] + verticesOffset;
        indices[indicesOffset++] = triangles[i + 2] + verticesOffset;
    }
    let index = verticesOffset * verticesStride;
    for(let i = 0; i < points.length; i += 2){
        vertices[index] = points[i];
        vertices[index + 1] = points[i + 1];
        index += verticesStride;
    }
}
;
 //# sourceMappingURL=triangulateWithHoles.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildPolygon.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildPolygon",
    ()=>buildPolygon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$triangulateWithHoles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/triangulateWithHoles.mjs [app-client] (ecmascript)");
;
;
"use strict";
const emptyArray = [];
const buildPolygon = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].ShapeBuilder,
        name: "polygon"
    },
    build (shape, points) {
        for(let i = 0; i < shape.points.length; i++){
            points[i] = shape.points[i];
        }
        return true;
    },
    triangulate (points, vertices, verticesStride, verticesOffset, indices, indicesOffset) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$triangulateWithHoles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["triangulateWithHoles"])(points, emptyArray, vertices, verticesStride, verticesOffset, indices, indicesOffset);
    }
};
;
 //# sourceMappingURL=buildPolygon.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildRectangle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildRectangle",
    ()=>buildRectangle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
;
"use strict";
const buildRectangle = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].ShapeBuilder,
        name: "rectangle"
    },
    build (shape, points) {
        const rectData = shape;
        const x = rectData.x;
        const y = rectData.y;
        const width = rectData.width;
        const height = rectData.height;
        if (!(width > 0 && height > 0)) {
            return false;
        }
        points[0] = x;
        points[1] = y;
        points[2] = x + width;
        points[3] = y;
        points[4] = x + width;
        points[5] = y + height;
        points[6] = x;
        points[7] = y + height;
        return true;
    },
    triangulate (points, vertices, verticesStride, verticesOffset, indices, indicesOffset) {
        let count = 0;
        verticesOffset *= verticesStride;
        vertices[verticesOffset + count] = points[0];
        vertices[verticesOffset + count + 1] = points[1];
        count += verticesStride;
        vertices[verticesOffset + count] = points[2];
        vertices[verticesOffset + count + 1] = points[3];
        count += verticesStride;
        vertices[verticesOffset + count] = points[6];
        vertices[verticesOffset + count + 1] = points[7];
        count += verticesStride;
        vertices[verticesOffset + count] = points[4];
        vertices[verticesOffset + count + 1] = points[5];
        count += verticesStride;
        const verticesIndex = verticesOffset / verticesStride;
        indices[indicesOffset++] = verticesIndex;
        indices[indicesOffset++] = verticesIndex + 1;
        indices[indicesOffset++] = verticesIndex + 2;
        indices[indicesOffset++] = verticesIndex + 1;
        indices[indicesOffset++] = verticesIndex + 3;
        indices[indicesOffset++] = verticesIndex + 2;
    }
};
;
 //# sourceMappingURL=buildRectangle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildTriangle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildTriangle",
    ()=>buildTriangle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
;
"use strict";
const buildTriangle = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].ShapeBuilder,
        name: "triangle"
    },
    build (shape, points) {
        points[0] = shape.x;
        points[1] = shape.y;
        points[2] = shape.x2;
        points[3] = shape.y2;
        points[4] = shape.x3;
        points[5] = shape.y3;
        return true;
    },
    triangulate (points, vertices, verticesStride, verticesOffset, indices, indicesOffset) {
        let count = 0;
        verticesOffset *= verticesStride;
        vertices[verticesOffset + count] = points[0];
        vertices[verticesOffset + count + 1] = points[1];
        count += verticesStride;
        vertices[verticesOffset + count] = points[2];
        vertices[verticesOffset + count + 1] = points[3];
        count += verticesStride;
        vertices[verticesOffset + count] = points[4];
        vertices[verticesOffset + count + 1] = points[5];
        const verticesIndex = verticesOffset / verticesStride;
        indices[indicesOffset++] = verticesIndex;
        indices[indicesOffset++] = verticesIndex + 1;
        indices[indicesOffset++] = verticesIndex + 2;
    }
};
;
 //# sourceMappingURL=buildTriangle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/generateTextureFillMatrix.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateTextureMatrix",
    ()=>generateTextureMatrix
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/fill/FillGradient.mjs [app-client] (ecmascript)");
;
;
;
"use strict";
const tempTextureMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
const tempRect = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"]();
function generateTextureMatrix(out, style, shape, matrix) {
    const textureMatrix = style.matrix ? out.copyFrom(style.matrix).invert() : out.identity();
    if (style.textureSpace === "local") {
        const bounds = shape.getBounds(tempRect);
        if (style.width) {
            bounds.pad(style.width);
        }
        const { x: tx, y: ty } = bounds;
        const sx = 1 / bounds.width;
        const sy = 1 / bounds.height;
        const mTx = -tx * sx;
        const mTy = -ty * sy;
        const a1 = textureMatrix.a;
        const b1 = textureMatrix.b;
        const c1 = textureMatrix.c;
        const d1 = textureMatrix.d;
        textureMatrix.a *= sx;
        textureMatrix.b *= sx;
        textureMatrix.c *= sy;
        textureMatrix.d *= sy;
        textureMatrix.tx = mTx * a1 + mTy * c1 + textureMatrix.tx;
        textureMatrix.ty = mTx * b1 + mTy * d1 + textureMatrix.ty;
    } else {
        textureMatrix.translate(style.texture.frame.x, style.texture.frame.y);
        textureMatrix.scale(1 / style.texture.source.width, 1 / style.texture.source.height);
    }
    const sourceStyle = style.texture.source.style;
    if (!(style.fill instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillGradient"]) && sourceStyle.addressMode === "clamp-to-edge") {
        sourceStyle.addressMode = "repeat";
        sourceStyle.update();
    }
    if (matrix) {
        textureMatrix.append(tempTextureMatrix.copyFrom(matrix).invert());
    }
    return textureMatrix;
}
;
 //# sourceMappingURL=generateTextureFillMatrix.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/buildContextBatches.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildContextBatches",
    ()=>buildContextBatches,
    "shapeBuilders",
    ()=>shapeBuilders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$buildUvs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/buildUvs.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$transformVertices$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/transformVertices.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$BatchableGraphics$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/BatchableGraphics.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildCircle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildCircle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildLine$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildLine.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildPixelLine$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildPixelLine.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildPolygon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildPolygon.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildRectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildRectangle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildTriangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildTriangle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$generateTextureFillMatrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/generateTextureFillMatrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$triangulateWithHoles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/triangulateWithHoles.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
;
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
const shapeBuilders = {};
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].handleByMap(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].ShapeBuilder, shapeBuilders);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildRectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildRectangle"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildPolygon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildPolygon"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildTriangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildTriangle"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildCircle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildCircle"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildCircle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildEllipse"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildCircle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildRoundedRectangle"]);
const tempRect = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"]();
const tempTextureMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
function buildContextBatches(context, gpuContext) {
    const { geometryData, batches } = gpuContext;
    batches.length = 0;
    geometryData.indices.length = 0;
    geometryData.vertices.length = 0;
    geometryData.uvs.length = 0;
    for(let i = 0; i < context.instructions.length; i++){
        const instruction = context.instructions[i];
        if (instruction.action === "texture") {
            addTextureToGeometryData(instruction.data, batches, geometryData);
        } else if (instruction.action === "fill" || instruction.action === "stroke") {
            const isStroke = instruction.action === "stroke";
            const shapePath = instruction.data.path.shapePath;
            const style = instruction.data.style;
            const hole = instruction.data.hole;
            if (isStroke && hole) {
                addShapePathToGeometryData(hole.shapePath, style, true, batches, geometryData);
            }
            if (hole) {
                shapePath.shapePrimitives[shapePath.shapePrimitives.length - 1].holes = hole.shapePath.shapePrimitives;
            }
            addShapePathToGeometryData(shapePath, style, isStroke, batches, geometryData);
        }
    }
}
function addTextureToGeometryData(data, batches, geometryData) {
    const points = [];
    const build = shapeBuilders.rectangle;
    const rect = tempRect;
    rect.x = data.dx;
    rect.y = data.dy;
    rect.width = data.dw;
    rect.height = data.dh;
    const matrix = data.transform;
    if (!build.build(rect, points)) {
        return;
    }
    const { vertices, uvs, indices } = geometryData;
    const indexOffset = indices.length;
    const vertOffset = vertices.length / 2;
    if (matrix) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$transformVertices$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformVertices"])(points, matrix);
    }
    build.triangulate(points, vertices, 2, vertOffset, indices, indexOffset);
    const texture = data.image;
    const textureUvs = texture.uvs;
    uvs.push(textureUvs.x0, textureUvs.y0, textureUvs.x1, textureUvs.y1, textureUvs.x3, textureUvs.y3, textureUvs.x2, textureUvs.y2);
    const graphicsBatch = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BigPool"].get(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$BatchableGraphics$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BatchableGraphics"]);
    graphicsBatch.indexOffset = indexOffset;
    graphicsBatch.indexSize = indices.length - indexOffset;
    graphicsBatch.attributeOffset = vertOffset;
    graphicsBatch.attributeSize = vertices.length / 2 - vertOffset;
    graphicsBatch.baseColor = data.style;
    graphicsBatch.alpha = data.alpha;
    graphicsBatch.texture = texture;
    graphicsBatch.geometryData = geometryData;
    batches.push(graphicsBatch);
}
function addShapePathToGeometryData(shapePath, style, isStroke, batches, geometryData) {
    const { vertices, uvs, indices } = geometryData;
    shapePath.shapePrimitives.forEach((param)=>{
        let { shape, transform: matrix, holes } = param;
        const points = [];
        const build = shapeBuilders[shape.type];
        if (!build.build(shape, points)) {
            return;
        }
        const indexOffset = indices.length;
        const vertOffset = vertices.length / 2;
        let topology = "triangle-list";
        if (matrix) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$transformVertices$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformVertices"])(points, matrix);
        }
        if (!isStroke) {
            if (holes) {
                const holeIndices = [];
                const otherPoints = points.slice();
                const holeArrays = getHoleArrays(holes);
                holeArrays.forEach((holePoints)=>{
                    holeIndices.push(otherPoints.length / 2);
                    otherPoints.push(...holePoints);
                });
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$triangulateWithHoles$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["triangulateWithHoles"])(otherPoints, holeIndices, vertices, 2, vertOffset, indices, indexOffset);
            } else {
                build.triangulate(points, vertices, 2, vertOffset, indices, indexOffset);
            }
        } else {
            var _shape_closePath;
            const close = (_shape_closePath = shape.closePath) !== null && _shape_closePath !== void 0 ? _shape_closePath : true;
            const lineStyle = style;
            if (!lineStyle.pixelLine) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildLine$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildLine"])(points, lineStyle, false, close, vertices, indices);
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildPixelLine$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildPixelLine"])(points, close, vertices, indices);
                topology = "line-list";
            }
        }
        const uvsOffset = uvs.length / 2;
        const texture = style.texture;
        if (texture !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].WHITE) {
            const textureMatrix = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$generateTextureFillMatrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateTextureMatrix"])(tempTextureMatrix, style, shape, matrix);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$buildUvs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildUvs"])(vertices, 2, vertOffset, uvs, uvsOffset, 2, vertices.length / 2 - vertOffset, textureMatrix);
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$buildUvs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildSimpleUvs"])(uvs, uvsOffset, 2, vertices.length / 2 - vertOffset);
        }
        const graphicsBatch = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BigPool"].get(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$BatchableGraphics$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BatchableGraphics"]);
        graphicsBatch.indexOffset = indexOffset;
        graphicsBatch.indexSize = indices.length - indexOffset;
        graphicsBatch.attributeOffset = vertOffset;
        graphicsBatch.attributeSize = vertices.length / 2 - vertOffset;
        graphicsBatch.baseColor = style.color;
        graphicsBatch.alpha = style.alpha;
        graphicsBatch.texture = texture;
        graphicsBatch.geometryData = geometryData;
        graphicsBatch.topology = topology;
        batches.push(graphicsBatch);
    });
}
function getHoleArrays(holePrimitives) {
    const holeArrays = [];
    for(let k = 0; k < holePrimitives.length; k++){
        const holePrimitive = holePrimitives[k].shape;
        const holePoints = [];
        const holeBuilder = shapeBuilders[holePrimitive.type];
        if (holeBuilder.build(holePrimitive, holePoints)) {
            holeArrays.push(holePoints);
        }
    }
    return holeArrays;
}
;
 //# sourceMappingURL=buildContextBatches.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/GraphicsContextSystem.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuGraphicsContext",
    ()=>GpuGraphicsContext,
    "GraphicsContextRenderData",
    ()=>GraphicsContextRenderData,
    "GraphicsContextSystem",
    ()=>GraphicsContextSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gpu$2f$getTextureBatchBindGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gpu/getTextureBatchBindGroup.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$DefaultBatcher$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/DefaultBatcher.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$instructions$2f$InstructionSet$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/instructions/InstructionSet.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$buildContextBatches$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/buildContextBatches.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
class GpuGraphicsContext {
    constructor(){
        this.batches = [];
        this.geometryData = {
            vertices: [],
            uvs: [],
            indices: []
        };
    }
}
class GraphicsContextRenderData {
    init(maxTextures) {
        this.batcher = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$DefaultBatcher$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DefaultBatcher"]({
            maxTextures
        });
        this.instructions.reset();
    }
    /**
   * @deprecated since version 8.0.0
   * Use `batcher.geometry` instead.
   * @see {Batcher#geometry}
   */ get geometry() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_3_4"], "GraphicsContextRenderData#geometry is deprecated, please use batcher.geometry instead.");
        return this.batcher.geometry;
    }
    destroy() {
        this.batcher.destroy();
        this.instructions.destroy();
        this.batcher = null;
        this.instructions = null;
    }
    constructor(){
        this.instructions = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$instructions$2f$InstructionSet$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InstructionSet"]();
    }
}
const _GraphicsContextSystem = class _GraphicsContextSystem {
    /**
   * Runner init called, update the default options
   * @ignore
   */ init(options) {
        var _options_bezierSmoothness;
        _GraphicsContextSystem.defaultOptions.bezierSmoothness = (_options_bezierSmoothness = options === null || options === void 0 ? void 0 : options.bezierSmoothness) !== null && _options_bezierSmoothness !== void 0 ? _options_bezierSmoothness : _GraphicsContextSystem.defaultOptions.bezierSmoothness;
    }
    /**
   * Returns the render data for a given GraphicsContext.
   * @param context - The GraphicsContext to get the render data for.
   * @internal
   */ getContextRenderData(context) {
        return this._graphicsDataContextHash[context.uid] || this._initContextRenderData(context);
    }
    /**
   * Updates the GPU context for a given GraphicsContext.
   * If the context is dirty, it will rebuild the batches and geometry data.
   * @param context - The GraphicsContext to update.
   * @returns The updated GpuGraphicsContext.
   * @internal
   */ updateGpuContext(context) {
        let gpuContext = this._gpuContextHash[context.uid] || this._initContext(context);
        if (context.dirty) {
            if (gpuContext) {
                this._cleanGraphicsContextData(context);
            } else {
                gpuContext = this._initContext(context);
            }
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$buildContextBatches$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildContextBatches"])(context, gpuContext);
            const batchMode = context.batchMode;
            if (context.customShader || batchMode === "no-batch") {
                gpuContext.isBatchable = false;
            } else if (batchMode === "auto") {
                gpuContext.isBatchable = gpuContext.geometryData.vertices.length < 400;
            } else {
                gpuContext.isBatchable = true;
            }
            context.dirty = false;
        }
        return gpuContext;
    }
    /**
   * Returns the GpuGraphicsContext for a given GraphicsContext.
   * If it does not exist, it will initialize a new one.
   * @param context - The GraphicsContext to get the GpuGraphicsContext for.
   * @returns The GpuGraphicsContext for the given GraphicsContext.
   * @internal
   */ getGpuContext(context) {
        return this._gpuContextHash[context.uid] || this._initContext(context);
    }
    _initContextRenderData(context) {
        const graphicsData = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BigPool"].get(GraphicsContextRenderData, {
            maxTextures: this._renderer.limits.maxBatchableTextures
        });
        const { batches, geometryData } = this._gpuContextHash[context.uid];
        const vertexSize = geometryData.vertices.length;
        const indexSize = geometryData.indices.length;
        for(let i = 0; i < batches.length; i++){
            batches[i].applyTransform = false;
        }
        const batcher = graphicsData.batcher;
        batcher.ensureAttributeBuffer(vertexSize);
        batcher.ensureIndexBuffer(indexSize);
        batcher.begin();
        for(let i = 0; i < batches.length; i++){
            const batch = batches[i];
            batcher.add(batch);
        }
        batcher.finish(graphicsData.instructions);
        const geometry = batcher.geometry;
        geometry.indexBuffer.setDataWithSize(batcher.indexBuffer, batcher.indexSize, true);
        geometry.buffers[0].setDataWithSize(batcher.attributeBuffer.float32View, batcher.attributeSize, true);
        const drawBatches = batcher.batches;
        for(let i = 0; i < drawBatches.length; i++){
            const batch = drawBatches[i];
            batch.bindGroup = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gpu$2f$getTextureBatchBindGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTextureBatchBindGroup"])(batch.textures.textures, batch.textures.count, this._renderer.limits.maxBatchableTextures);
        }
        this._graphicsDataContextHash[context.uid] = graphicsData;
        return graphicsData;
    }
    _initContext(context) {
        const gpuContext = new GpuGraphicsContext();
        gpuContext.context = context;
        this._gpuContextHash[context.uid] = gpuContext;
        context.on("destroy", this.onGraphicsContextDestroy, this);
        return this._gpuContextHash[context.uid];
    }
    onGraphicsContextDestroy(context) {
        this._cleanGraphicsContextData(context);
        context.off("destroy", this.onGraphicsContextDestroy, this);
        this._gpuContextHash[context.uid] = null;
    }
    _cleanGraphicsContextData(context) {
        const gpuContext = this._gpuContextHash[context.uid];
        if (!gpuContext.isBatchable) {
            if (this._graphicsDataContextHash[context.uid]) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BigPool"].return(this.getContextRenderData(context));
                this._graphicsDataContextHash[context.uid] = null;
            }
        }
        if (gpuContext.batches) {
            gpuContext.batches.forEach((batch)=>{
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BigPool"].return(batch);
            });
        }
    }
    destroy() {
        for(const i in this._gpuContextHash){
            if (this._gpuContextHash[i]) {
                this.onGraphicsContextDestroy(this._gpuContextHash[i].context);
            }
        }
    }
    constructor(renderer){
        // the root context batches, used to either make a batch or geometry
        // all graphics use this as a base
        this._gpuContextHash = {};
        // used for non-batchable graphics
        this._graphicsDataContextHash = /* @__PURE__ */ Object.create(null);
        this._renderer = renderer;
        renderer.renderableGC.addManagedHash(this, "_gpuContextHash");
        renderer.renderableGC.addManagedHash(this, "_graphicsDataContextHash");
    }
};
/** @ignore */ _GraphicsContextSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "graphicsContext"
};
/** The default options for the GraphicsContextSystem. */ _GraphicsContextSystem.defaultOptions = {
    /**
   * A value from 0 to 1 that controls the smoothness of bezier curves (the higher the smoother)
   * @default 0.5
   */ bezierSmoothness: 0.5
};
let GraphicsContextSystem = _GraphicsContextSystem;
;
 //# sourceMappingURL=GraphicsContextSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildAdaptiveBezier.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildAdaptiveBezier",
    ()=>buildAdaptiveBezier
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContextSystem$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/GraphicsContextSystem.mjs [app-client] (ecmascript)");
;
"use strict";
const RECURSION_LIMIT = 8;
const FLT_EPSILON = 11920929e-14;
const PATH_DISTANCE_EPSILON = 1;
const curveAngleToleranceEpsilon = 0.01;
const mAngleTolerance = 0;
const mCuspLimit = 0;
function buildAdaptiveBezier(points, sX, sY, cp1x, cp1y, cp2x, cp2y, eX, eY, smoothness) {
    const scale = 1;
    const smoothing = Math.min(0.99, // a value of 1.0 actually inverts smoothing, so we cap it at 0.99
    Math.max(0, smoothness !== null && smoothness !== void 0 ? smoothness : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContextSystem$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsContextSystem"].defaultOptions.bezierSmoothness));
    let distanceTolerance = (PATH_DISTANCE_EPSILON - smoothing) / scale;
    distanceTolerance *= distanceTolerance;
    begin(sX, sY, cp1x, cp1y, cp2x, cp2y, eX, eY, points, distanceTolerance);
    return points;
}
function begin(sX, sY, cp1x, cp1y, cp2x, cp2y, eX, eY, points, distanceTolerance) {
    recursive(sX, sY, cp1x, cp1y, cp2x, cp2y, eX, eY, points, distanceTolerance, 0);
    points.push(eX, eY);
}
function recursive(x1, y1, x2, y2, x3, y3, x4, y4, points, distanceTolerance, level) {
    if (level > RECURSION_LIMIT) {
        return;
    }
    const pi = Math.PI;
    const x12 = (x1 + x2) / 2;
    const y12 = (y1 + y2) / 2;
    const x23 = (x2 + x3) / 2;
    const y23 = (y2 + y3) / 2;
    const x34 = (x3 + x4) / 2;
    const y34 = (y3 + y4) / 2;
    const x123 = (x12 + x23) / 2;
    const y123 = (y12 + y23) / 2;
    const x234 = (x23 + x34) / 2;
    const y234 = (y23 + y34) / 2;
    const x1234 = (x123 + x234) / 2;
    const y1234 = (y123 + y234) / 2;
    if (level > 0) {
        let dx = x4 - x1;
        let dy = y4 - y1;
        const d2 = Math.abs((x2 - x4) * dy - (y2 - y4) * dx);
        const d3 = Math.abs((x3 - x4) * dy - (y3 - y4) * dx);
        let da1;
        let da2;
        if (d2 > FLT_EPSILON && d3 > FLT_EPSILON) {
            if ((d2 + d3) * (d2 + d3) <= distanceTolerance * (dx * dx + dy * dy)) {
                if (mAngleTolerance < curveAngleToleranceEpsilon) {
                    points.push(x1234, y1234);
                    return;
                }
                const a23 = Math.atan2(y3 - y2, x3 - x2);
                da1 = Math.abs(a23 - Math.atan2(y2 - y1, x2 - x1));
                da2 = Math.abs(Math.atan2(y4 - y3, x4 - x3) - a23);
                if (da1 >= pi) da1 = 2 * pi - da1;
                if (da2 >= pi) da2 = 2 * pi - da2;
                if (da1 + da2 < mAngleTolerance) {
                    points.push(x1234, y1234);
                    return;
                }
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            }
        } else if (d2 > FLT_EPSILON) {
            if (d2 * d2 <= distanceTolerance * (dx * dx + dy * dy)) {
                if (mAngleTolerance < curveAngleToleranceEpsilon) {
                    points.push(x1234, y1234);
                    return;
                }
                da1 = Math.abs(Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y2 - y1, x2 - x1));
                if (da1 >= pi) da1 = 2 * pi - da1;
                if (da1 < mAngleTolerance) {
                    points.push(x2, y2);
                    points.push(x3, y3);
                    return;
                }
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            }
        } else if (d3 > FLT_EPSILON) {
            if (d3 * d3 <= distanceTolerance * (dx * dx + dy * dy)) {
                if (mAngleTolerance < curveAngleToleranceEpsilon) {
                    points.push(x1234, y1234);
                    return;
                }
                da1 = Math.abs(Math.atan2(y4 - y3, x4 - x3) - Math.atan2(y3 - y2, x3 - x2));
                if (da1 >= pi) da1 = 2 * pi - da1;
                if (da1 < mAngleTolerance) {
                    points.push(x2, y2);
                    points.push(x3, y3);
                    return;
                }
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            }
        } else {
            dx = x1234 - (x1 + x4) / 2;
            dy = y1234 - (y1 + y4) / 2;
            if (dx * dx + dy * dy <= distanceTolerance) {
                points.push(x1234, y1234);
                return;
            }
        }
    }
    recursive(x1, y1, x12, y12, x123, y123, x1234, y1234, points, distanceTolerance, level + 1);
    recursive(x1234, y1234, x234, y234, x34, y34, x4, y4, points, distanceTolerance, level + 1);
}
;
 //# sourceMappingURL=buildAdaptiveBezier.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildAdaptiveQuadratic.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildAdaptiveQuadratic",
    ()=>buildAdaptiveQuadratic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContextSystem$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/GraphicsContextSystem.mjs [app-client] (ecmascript)");
;
"use strict";
const RECURSION_LIMIT = 8;
const FLT_EPSILON = 11920929e-14;
const PATH_DISTANCE_EPSILON = 1;
const curveAngleToleranceEpsilon = 0.01;
const mAngleTolerance = 0;
function buildAdaptiveQuadratic(points, sX, sY, cp1x, cp1y, eX, eY, smoothness) {
    const scale = 1;
    const smoothing = Math.min(0.99, // a value of 1.0 actually inverts smoothing, so we cap it at 0.99
    Math.max(0, smoothness !== null && smoothness !== void 0 ? smoothness : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContextSystem$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsContextSystem"].defaultOptions.bezierSmoothness));
    let distanceTolerance = (PATH_DISTANCE_EPSILON - smoothing) / scale;
    distanceTolerance *= distanceTolerance;
    begin(sX, sY, cp1x, cp1y, eX, eY, points, distanceTolerance);
    return points;
}
function begin(sX, sY, cp1x, cp1y, eX, eY, points, distanceTolerance) {
    recursive(points, sX, sY, cp1x, cp1y, eX, eY, distanceTolerance, 0);
    points.push(eX, eY);
}
function recursive(points, x1, y1, x2, y2, x3, y3, distanceTolerance, level) {
    if (level > RECURSION_LIMIT) {
        return;
    }
    const pi = Math.PI;
    const x12 = (x1 + x2) / 2;
    const y12 = (y1 + y2) / 2;
    const x23 = (x2 + x3) / 2;
    const y23 = (y2 + y3) / 2;
    const x123 = (x12 + x23) / 2;
    const y123 = (y12 + y23) / 2;
    let dx = x3 - x1;
    let dy = y3 - y1;
    const d = Math.abs((x2 - x3) * dy - (y2 - y3) * dx);
    if (d > FLT_EPSILON) {
        if (d * d <= distanceTolerance * (dx * dx + dy * dy)) {
            if (mAngleTolerance < curveAngleToleranceEpsilon) {
                points.push(x123, y123);
                return;
            }
            let da = Math.abs(Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y2 - y1, x2 - x1));
            if (da >= pi) da = 2 * pi - da;
            if (da < mAngleTolerance) {
                points.push(x123, y123);
                return;
            }
        }
    } else {
        dx = x123 - (x1 + x3) / 2;
        dy = y123 - (y1 + y3) / 2;
        if (dx * dx + dy * dy <= distanceTolerance) {
            points.push(x123, y123);
            return;
        }
    }
    recursive(points, x1, y1, x12, y12, x123, y123, distanceTolerance, level + 1);
    recursive(points, x123, y123, x23, y23, x3, y3, distanceTolerance, level + 1);
}
;
 //# sourceMappingURL=buildAdaptiveQuadratic.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildArc.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildArc",
    ()=>buildArc
]);
"use strict";
function buildArc(points, x, y, radius, start, end, clockwise, steps) {
    let dist = Math.abs(start - end);
    if (!clockwise && start > end) {
        dist = 2 * Math.PI - dist;
    } else if (clockwise && end > start) {
        dist = 2 * Math.PI - dist;
    }
    steps || (steps = Math.max(6, Math.floor(6 * Math.pow(radius, 1 / 3) * (dist / Math.PI))));
    steps = Math.max(steps, 3);
    let f = dist / steps;
    let t = start;
    f *= clockwise ? -1 : 1;
    for(let i = 0; i < steps + 1; i++){
        const cs = Math.cos(t);
        const sn = Math.sin(t);
        const nx = x + cs * radius;
        const ny = y + sn * radius;
        points.push(nx, ny);
        t += f;
    }
}
;
 //# sourceMappingURL=buildArc.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildArcTo.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildArcTo",
    ()=>buildArcTo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildArc$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildArc.mjs [app-client] (ecmascript)");
;
"use strict";
function buildArcTo(points, x1, y1, x2, y2, radius) {
    const fromX = points[points.length - 2];
    const fromY = points[points.length - 1];
    const a1 = fromY - y1;
    const b1 = fromX - x1;
    const a2 = y2 - y1;
    const b2 = x2 - x1;
    const mm = Math.abs(a1 * b2 - b1 * a2);
    if (mm < 1e-8 || radius === 0) {
        if (points[points.length - 2] !== x1 || points[points.length - 1] !== y1) {
            points.push(x1, y1);
        }
        return;
    }
    const dd = a1 * a1 + b1 * b1;
    const cc = a2 * a2 + b2 * b2;
    const tt = a1 * a2 + b1 * b2;
    const k1 = radius * Math.sqrt(dd) / mm;
    const k2 = radius * Math.sqrt(cc) / mm;
    const j1 = k1 * tt / dd;
    const j2 = k2 * tt / cc;
    const cx = k1 * b2 + k2 * b1;
    const cy = k1 * a2 + k2 * a1;
    const px = b1 * (k2 + j1);
    const py = a1 * (k2 + j1);
    const qx = b2 * (k1 + j2);
    const qy = a2 * (k1 + j2);
    const startAngle = Math.atan2(py - cy, px - cx);
    const endAngle = Math.atan2(qy - cy, qx - cx);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildArc$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildArc"])(points, cx + x1, cy + y1, radius, startAngle, endAngle, b1 * a2 > b2 * a1);
}
;
 //# sourceMappingURL=buildArcTo.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildArcToSvg.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildArcToSvg",
    ()=>buildArcToSvg
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildAdaptiveBezier$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildAdaptiveBezier.mjs [app-client] (ecmascript)");
;
"use strict";
const TAU = Math.PI * 2;
const out = {
    centerX: 0,
    centerY: 0,
    ang1: 0,
    ang2: 0
};
const mapToEllipse = (param, rx, ry, cosPhi, sinPhi, centerX, centerY, out2)=>{
    let { x, y } = param;
    x *= rx;
    y *= ry;
    const xp = cosPhi * x - sinPhi * y;
    const yp = sinPhi * x + cosPhi * y;
    out2.x = xp + centerX;
    out2.y = yp + centerY;
    return out2;
};
function approxUnitArc(ang1, ang2) {
    const a1 = ang2 === -1.5707963267948966 ? -0.551915024494 : 4 / 3 * Math.tan(ang2 / 4);
    const a = ang2 === 1.5707963267948966 ? 0.551915024494 : a1;
    const x1 = Math.cos(ang1);
    const y1 = Math.sin(ang1);
    const x2 = Math.cos(ang1 + ang2);
    const y2 = Math.sin(ang1 + ang2);
    return [
        {
            x: x1 - y1 * a,
            y: y1 + x1 * a
        },
        {
            x: x2 + y2 * a,
            y: y2 - x2 * a
        },
        {
            x: x2,
            y: y2
        }
    ];
}
const vectorAngle = (ux, uy, vx, vy)=>{
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;
    let dot = ux * vx + uy * vy;
    if (dot > 1) {
        dot = 1;
    }
    if (dot < -1) {
        dot = -1;
    }
    return sign * Math.acos(dot);
};
const getArcCenter = (px, py, cx, cy, rx, ry, largeArcFlag, sweepFlag, sinPhi, cosPhi, pxp, pyp, out2)=>{
    const rxSq = Math.pow(rx, 2);
    const rySq = Math.pow(ry, 2);
    const pxpSq = Math.pow(pxp, 2);
    const pypSq = Math.pow(pyp, 2);
    let radicant = rxSq * rySq - rxSq * pypSq - rySq * pxpSq;
    if (radicant < 0) {
        radicant = 0;
    }
    radicant /= rxSq * pypSq + rySq * pxpSq;
    radicant = Math.sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1);
    const centerXp = radicant * rx / ry * pyp;
    const centerYp = radicant * -ry / rx * pxp;
    const centerX = cosPhi * centerXp - sinPhi * centerYp + (px + cx) / 2;
    const centerY = sinPhi * centerXp + cosPhi * centerYp + (py + cy) / 2;
    const vx1 = (pxp - centerXp) / rx;
    const vy1 = (pyp - centerYp) / ry;
    const vx2 = (-pxp - centerXp) / rx;
    const vy2 = (-pyp - centerYp) / ry;
    const ang1 = vectorAngle(1, 0, vx1, vy1);
    let ang2 = vectorAngle(vx1, vy1, vx2, vy2);
    if (sweepFlag === 0 && ang2 > 0) {
        ang2 -= TAU;
    }
    if (sweepFlag === 1 && ang2 < 0) {
        ang2 += TAU;
    }
    out2.centerX = centerX;
    out2.centerY = centerY;
    out2.ang1 = ang1;
    out2.ang2 = ang2;
};
function buildArcToSvg(points, px, py, cx, cy, rx, ry) {
    let xAxisRotation = arguments.length > 7 && arguments[7] !== void 0 ? arguments[7] : 0, largeArcFlag = arguments.length > 8 && arguments[8] !== void 0 ? arguments[8] : 0, sweepFlag = arguments.length > 9 && arguments[9] !== void 0 ? arguments[9] : 0;
    if (rx === 0 || ry === 0) {
        return;
    }
    const sinPhi = Math.sin(xAxisRotation * TAU / 360);
    const cosPhi = Math.cos(xAxisRotation * TAU / 360);
    const pxp = cosPhi * (px - cx) / 2 + sinPhi * (py - cy) / 2;
    const pyp = -sinPhi * (px - cx) / 2 + cosPhi * (py - cy) / 2;
    if (pxp === 0 && pyp === 0) {
        return;
    }
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    const lambda = Math.pow(pxp, 2) / Math.pow(rx, 2) + Math.pow(pyp, 2) / Math.pow(ry, 2);
    if (lambda > 1) {
        rx *= Math.sqrt(lambda);
        ry *= Math.sqrt(lambda);
    }
    getArcCenter(px, py, cx, cy, rx, ry, largeArcFlag, sweepFlag, sinPhi, cosPhi, pxp, pyp, out);
    let { ang1, ang2 } = out;
    const { centerX, centerY } = out;
    let ratio = Math.abs(ang2) / (TAU / 4);
    if (Math.abs(1 - ratio) < 1e-7) {
        ratio = 1;
    }
    const segments = Math.max(Math.ceil(ratio), 1);
    ang2 /= segments;
    let lastX = points[points.length - 2];
    let lastY = points[points.length - 1];
    const outCurvePoint = {
        x: 0,
        y: 0
    };
    for(let i = 0; i < segments; i++){
        const curve = approxUnitArc(ang1, ang2);
        const { x: x1, y: y1 } = mapToEllipse(curve[0], rx, ry, cosPhi, sinPhi, centerX, centerY, outCurvePoint);
        const { x: x2, y: y2 } = mapToEllipse(curve[1], rx, ry, cosPhi, sinPhi, centerX, centerY, outCurvePoint);
        const { x, y } = mapToEllipse(curve[2], rx, ry, cosPhi, sinPhi, centerX, centerY, outCurvePoint);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildAdaptiveBezier$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildAdaptiveBezier"])(points, lastX, lastY, x1, y1, x2, y2, x, y);
        lastX = x;
        lastY = y;
        ang1 += ang2;
    }
}
;
 //# sourceMappingURL=buildArcToSvg.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/path/roundShape.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "roundedShapeArc",
    ()=>roundedShapeArc,
    "roundedShapeQuadraticCurve",
    ()=>roundedShapeQuadraticCurve
]);
"use strict";
function roundedShapeArc(g, points, radius) {
    const vecFrom = (p, pp)=>{
        const x = pp.x - p.x;
        const y = pp.y - p.y;
        const len = Math.sqrt(x * x + y * y);
        const nx = x / len;
        const ny = y / len;
        return {
            len,
            nx,
            ny
        };
    };
    const sharpCorner = (i, p)=>{
        if (i === 0) {
            g.moveTo(p.x, p.y);
        } else {
            g.lineTo(p.x, p.y);
        }
    };
    let p1 = points[points.length - 1];
    for(let i = 0; i < points.length; i++){
        const p2 = points[i % points.length];
        var _p2_radius;
        const pRadius = (_p2_radius = p2.radius) !== null && _p2_radius !== void 0 ? _p2_radius : radius;
        if (pRadius <= 0) {
            sharpCorner(i, p2);
            p1 = p2;
            continue;
        }
        const p3 = points[(i + 1) % points.length];
        const v1 = vecFrom(p2, p1);
        const v2 = vecFrom(p2, p3);
        if (v1.len < 1e-4 || v2.len < 1e-4) {
            sharpCorner(i, p2);
            p1 = p2;
            continue;
        }
        let angle = Math.asin(v1.nx * v2.ny - v1.ny * v2.nx);
        let radDirection = 1;
        let drawDirection = false;
        if (v1.nx * v2.nx - v1.ny * -v2.ny < 0) {
            if (angle < 0) {
                angle = Math.PI + angle;
            } else {
                angle = Math.PI - angle;
                radDirection = -1;
                drawDirection = true;
            }
        } else if (angle > 0) {
            radDirection = -1;
            drawDirection = true;
        }
        const halfAngle = angle / 2;
        let cRadius;
        let lenOut = Math.abs(Math.cos(halfAngle) * pRadius / Math.sin(halfAngle));
        if (lenOut > Math.min(v1.len / 2, v2.len / 2)) {
            lenOut = Math.min(v1.len / 2, v2.len / 2);
            cRadius = Math.abs(lenOut * Math.sin(halfAngle) / Math.cos(halfAngle));
        } else {
            cRadius = pRadius;
        }
        const cX = p2.x + v2.nx * lenOut + -v2.ny * cRadius * radDirection;
        const cY = p2.y + v2.ny * lenOut + v2.nx * cRadius * radDirection;
        const startAngle = Math.atan2(v1.ny, v1.nx) + Math.PI / 2 * radDirection;
        const endAngle = Math.atan2(v2.ny, v2.nx) - Math.PI / 2 * radDirection;
        if (i === 0) {
            g.moveTo(cX + Math.cos(startAngle) * cRadius, cY + Math.sin(startAngle) * cRadius);
        }
        g.arc(cX, cY, cRadius, startAngle, endAngle, drawDirection);
        p1 = p2;
    }
}
function roundedShapeQuadraticCurve(g, points, radius, smoothness) {
    const distance = (p1, p2)=>Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    const pointLerp = (p1, p2, t)=>({
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
        });
    const numPoints = points.length;
    for(let i = 0; i < numPoints; i++){
        const thisPoint = points[(i + 1) % numPoints];
        var _thisPoint_radius;
        const pRadius = (_thisPoint_radius = thisPoint.radius) !== null && _thisPoint_radius !== void 0 ? _thisPoint_radius : radius;
        if (pRadius <= 0) {
            if (i === 0) {
                g.moveTo(thisPoint.x, thisPoint.y);
            } else {
                g.lineTo(thisPoint.x, thisPoint.y);
            }
            continue;
        }
        const lastPoint = points[i];
        const nextPoint = points[(i + 2) % numPoints];
        const lastEdgeLength = distance(lastPoint, thisPoint);
        let start;
        if (lastEdgeLength < 1e-4) {
            start = thisPoint;
        } else {
            const lastOffsetDistance = Math.min(lastEdgeLength / 2, pRadius);
            start = pointLerp(thisPoint, lastPoint, lastOffsetDistance / lastEdgeLength);
        }
        const nextEdgeLength = distance(nextPoint, thisPoint);
        let end;
        if (nextEdgeLength < 1e-4) {
            end = thisPoint;
        } else {
            const nextOffsetDistance = Math.min(nextEdgeLength / 2, pRadius);
            end = pointLerp(thisPoint, nextPoint, nextOffsetDistance / nextEdgeLength);
        }
        if (i === 0) {
            g.moveTo(start.x, start.y);
        } else {
            g.lineTo(start.x, start.y);
        }
        g.quadraticCurveTo(thisPoint.x, thisPoint.y, end.x, end.y, smoothness);
    }
}
;
 //# sourceMappingURL=roundShape.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/path/ShapePath.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ShapePath",
    ()=>ShapePath
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Circle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Ellipse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Ellipse.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Polygon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Polygon.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$RoundedRectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/RoundedRectangle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildAdaptiveBezier$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildAdaptiveBezier.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildAdaptiveQuadratic$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildAdaptiveQuadratic.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildArc$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildArc.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildArcTo$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildArcTo.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildArcToSvg$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/buildCommands/buildArcToSvg.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$roundShape$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/path/roundShape.mjs [app-client] (ecmascript)");
;
;
;
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
const tempRectangle = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"]();
class ShapePath {
    /**
   * Sets the starting point for a new sub-path. Any subsequent drawing commands are considered part of this path.
   * @param x - The x-coordinate for the starting point.
   * @param y - The y-coordinate for the starting point.
   * @returns The instance of the current object for chaining.
   */ moveTo(x, y) {
        this.startPoly(x, y);
        return this;
    }
    /**
   * Connects the current point to a new point with a straight line. This method updates the current path.
   * @param x - The x-coordinate of the new point to connect to.
   * @param y - The y-coordinate of the new point to connect to.
   * @returns The instance of the current object for chaining.
   */ lineTo(x, y) {
        this._ensurePoly();
        const points = this._currentPoly.points;
        const fromX = points[points.length - 2];
        const fromY = points[points.length - 1];
        if (fromX !== x || fromY !== y) {
            points.push(x, y);
        }
        return this;
    }
    /**
   * Adds an arc to the path. The arc is centered at (x, y)
   *  position with radius `radius` starting at `startAngle` and ending at `endAngle`.
   * @param x - The x-coordinate of the arc's center.
   * @param y - The y-coordinate of the arc's center.
   * @param radius - The radius of the arc.
   * @param startAngle - The starting angle of the arc, in radians.
   * @param endAngle - The ending angle of the arc, in radians.
   * @param counterclockwise - Specifies whether the arc should be drawn in the anticlockwise direction. False by default.
   * @returns The instance of the current object for chaining.
   */ arc(x, y, radius, startAngle, endAngle, counterclockwise) {
        this._ensurePoly(false);
        const points = this._currentPoly.points;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildArc$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildArc"])(points, x, y, radius, startAngle, endAngle, counterclockwise);
        return this;
    }
    /**
   * Adds an arc to the path with the arc tangent to the line joining two specified points.
   * The arc radius is specified by `radius`.
   * @param x1 - The x-coordinate of the first point.
   * @param y1 - The y-coordinate of the first point.
   * @param x2 - The x-coordinate of the second point.
   * @param y2 - The y-coordinate of the second point.
   * @param radius - The radius of the arc.
   * @returns The instance of the current object for chaining.
   */ arcTo(x1, y1, x2, y2, radius) {
        this._ensurePoly();
        const points = this._currentPoly.points;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildArcTo$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildArcTo"])(points, x1, y1, x2, y2, radius);
        return this;
    }
    /**
   * Adds an SVG-style arc to the path, allowing for elliptical arcs based on the SVG spec.
   * @param rx - The x-radius of the ellipse.
   * @param ry - The y-radius of the ellipse.
   * @param xAxisRotation - The rotation of the ellipse's x-axis relative
   * to the x-axis of the coordinate system, in degrees.
   * @param largeArcFlag - Determines if the arc should be greater than or less than 180 degrees.
   * @param sweepFlag - Determines if the arc should be swept in a positive angle direction.
   * @param x - The x-coordinate of the arc's end point.
   * @param y - The y-coordinate of the arc's end point.
   * @returns The instance of the current object for chaining.
   */ arcToSvg(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
        const points = this._currentPoly.points;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildArcToSvg$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildArcToSvg"])(points, this._currentPoly.lastX, this._currentPoly.lastY, x, y, rx, ry, xAxisRotation, largeArcFlag, sweepFlag);
        return this;
    }
    /**
   * Adds a cubic Bezier curve to the path.
   * It requires three points: the first two are control points and the third one is the end point.
   * The starting point is the last point in the current path.
   * @param cp1x - The x-coordinate of the first control point.
   * @param cp1y - The y-coordinate of the first control point.
   * @param cp2x - The x-coordinate of the second control point.
   * @param cp2y - The y-coordinate of the second control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */ bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y, smoothness) {
        this._ensurePoly();
        const currentPoly = this._currentPoly;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildAdaptiveBezier$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildAdaptiveBezier"])(this._currentPoly.points, currentPoly.lastX, currentPoly.lastY, cp1x, cp1y, cp2x, cp2y, x, y, smoothness);
        return this;
    }
    /**
   * Adds a quadratic curve to the path. It requires two points: the control point and the end point.
   * The starting point is the last point in the current path.
   * @param cp1x - The x-coordinate of the control point.
   * @param cp1y - The y-coordinate of the control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothing - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */ quadraticCurveTo(cp1x, cp1y, x, y, smoothing) {
        this._ensurePoly();
        const currentPoly = this._currentPoly;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$buildCommands$2f$buildAdaptiveQuadratic$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildAdaptiveQuadratic"])(this._currentPoly.points, currentPoly.lastX, currentPoly.lastY, cp1x, cp1y, x, y, smoothing);
        return this;
    }
    /**
   * Closes the current path by drawing a straight line back to the start.
   * If the shape is already closed or there are no points in the path, this method does nothing.
   * @returns The instance of the current object for chaining.
   */ closePath() {
        this.endPoly(true);
        return this;
    }
    /**
   * Adds another path to the current path. This method allows for the combination of multiple paths into one.
   * @param path - The `GraphicsPath` object representing the path to add.
   * @param transform - An optional `Matrix` object to apply a transformation to the path before adding it.
   * @returns The instance of the current object for chaining.
   */ addPath(path, transform) {
        this.endPoly();
        if (transform && !transform.isIdentity()) {
            path = path.clone(true);
            path.transform(transform);
        }
        const shapePrimitives = this.shapePrimitives;
        const start = shapePrimitives.length;
        for(let i = 0; i < path.instructions.length; i++){
            const instruction = path.instructions[i];
            this[instruction.action](...instruction.data);
        }
        if (path.checkForHoles && shapePrimitives.length - start > 1) {
            let mainShape = null;
            for(let i = start; i < shapePrimitives.length; i++){
                const shapePrimitive = shapePrimitives[i];
                if (shapePrimitive.shape.type === "polygon") {
                    const polygon = shapePrimitive.shape;
                    const mainPolygon = mainShape === null || mainShape === void 0 ? void 0 : mainShape.shape;
                    if (mainPolygon && mainPolygon.containsPolygon(polygon)) {
                        mainShape.holes || (mainShape.holes = []);
                        mainShape.holes.push(shapePrimitive);
                        shapePrimitives.copyWithin(i, i + 1);
                        shapePrimitives.length--;
                        i--;
                    } else {
                        mainShape = shapePrimitive;
                    }
                }
            }
        }
        return this;
    }
    /**
   * Finalizes the drawing of the current path. Optionally, it can close the path.
   * @param closePath - A boolean indicating whether to close the path after finishing. False by default.
   */ finish() {
        let closePath = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        this.endPoly(closePath);
    }
    /**
   * Draws a rectangle shape. This method adds a new rectangle path to the current drawing.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param transform - An optional `Matrix` object to apply a transformation to the rectangle.
   * @returns The instance of the current object for chaining.
   */ rect(x, y, w, h, transform) {
        this.drawShape(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"](x, y, w, h), transform);
        return this;
    }
    /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @param transform - An optional `Matrix` object to apply a transformation to the circle.
   * @returns The instance of the current object for chaining.
   */ circle(x, y, radius, transform) {
        this.drawShape(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"](x, y, radius), transform);
        return this;
    }
    /**
   * Draws a polygon shape. This method allows for the creation of complex polygons by specifying a sequence of points.
   * @param points - An array of numbers, or or an array of PointData objects eg [{x,y}, {x,y}, {x,y}]
   * representing the x and y coordinates of the polygon's vertices, in sequence.
   * @param close - A boolean indicating whether to close the polygon path. True by default.
   * @param transform - An optional `Matrix` object to apply a transformation to the polygon.
   * @returns The instance of the current object for chaining.
   */ poly(points, close, transform) {
        const polygon = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Polygon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Polygon"](points);
        polygon.closePath = close;
        this.drawShape(polygon, transform);
        return this;
    }
    /**
   * Draws a regular polygon with a specified number of sides. All sides and angles are equal.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @param transform - An optional `Matrix` object to apply a transformation to the polygon.
   * @returns The instance of the current object for chaining.
   */ regularPoly(x, y, radius, sides) {
        let rotation = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 0, transform = arguments.length > 5 ? arguments[5] : void 0;
        sides = Math.max(sides | 0, 3);
        const startAngle = -1 * Math.PI / 2 + rotation;
        const delta = Math.PI * 2 / sides;
        const polygon = [];
        for(let i = 0; i < sides; i++){
            const angle = startAngle - i * delta;
            polygon.push(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
        }
        this.poly(polygon, true, transform);
        return this;
    }
    /**
   * Draws a polygon with rounded corners.
   * Similar to `regularPoly` but with the ability to round the corners of the polygon.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param corner - The radius of the rounding of the corners.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @param smoothness - Optional parameter to adjust the smoothness of the rounding.
   * @returns The instance of the current object for chaining.
   */ roundPoly(x, y, radius, sides, corner) {
        let rotation = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : 0, smoothness = arguments.length > 6 ? arguments[6] : void 0;
        sides = Math.max(sides | 0, 3);
        if (corner <= 0) {
            return this.regularPoly(x, y, radius, sides, rotation);
        }
        const sideLength = radius * Math.sin(Math.PI / sides) - 1e-3;
        corner = Math.min(corner, sideLength);
        const startAngle = -1 * Math.PI / 2 + rotation;
        const delta = Math.PI * 2 / sides;
        const internalAngle = (sides - 2) * Math.PI / sides / 2;
        for(let i = 0; i < sides; i++){
            const angle = i * delta + startAngle;
            const x0 = x + radius * Math.cos(angle);
            const y0 = y + radius * Math.sin(angle);
            const a1 = angle + Math.PI + internalAngle;
            const a2 = angle - Math.PI - internalAngle;
            const x1 = x0 + corner * Math.cos(a1);
            const y1 = y0 + corner * Math.sin(a1);
            const x3 = x0 + corner * Math.cos(a2);
            const y3 = y0 + corner * Math.sin(a2);
            if (i === 0) {
                this.moveTo(x1, y1);
            } else {
                this.lineTo(x1, y1);
            }
            this.quadraticCurveTo(x0, y0, x3, y3, smoothness);
        }
        return this.closePath();
    }
    /**
   * Draws a shape with rounded corners. This function supports custom radius for each corner of the shape.
   * Optionally, corners can be rounded using a quadratic curve instead of an arc, providing a different aesthetic.
   * @param points - An array of `RoundedPoint` representing the corners of the shape to draw.
   * A minimum of 3 points is required.
   * @param radius - The default radius for the corners.
   * This radius is applied to all corners unless overridden in `points`.
   * @param useQuadratic - If set to true, rounded corners are drawn using a quadraticCurve
   *  method instead of an arc method. Defaults to false.
   * @param smoothness - Specifies the smoothness of the curve when `useQuadratic` is true.
   * Higher values make the curve smoother.
   * @returns The instance of the current object for chaining.
   */ roundShape(points, radius) {
        let useQuadratic = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false, smoothness = arguments.length > 3 ? arguments[3] : void 0;
        if (points.length < 3) {
            return this;
        }
        if (useQuadratic) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$roundShape$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["roundedShapeQuadraticCurve"])(this, points, radius, smoothness);
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$roundShape$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["roundedShapeArc"])(this, points, radius);
        }
        return this.closePath();
    }
    /**
   * Draw Rectangle with fillet corners. This is much like rounded rectangle
   * however it support negative numbers as well for the corner radius.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param fillet - accept negative or positive values
   */ filletRect(x, y, width, height, fillet) {
        if (fillet === 0) {
            return this.rect(x, y, width, height);
        }
        const maxFillet = Math.min(width, height) / 2;
        const inset = Math.min(maxFillet, Math.max(-maxFillet, fillet));
        const right = x + width;
        const bottom = y + height;
        const dir = inset < 0 ? -inset : 0;
        const size = Math.abs(inset);
        return this.moveTo(x, y + size).arcTo(x + dir, y + dir, x + size, y, size).lineTo(right - size, y).arcTo(right - dir, y + dir, right, y + size, size).lineTo(right, bottom - size).arcTo(right - dir, bottom - dir, x + width - size, bottom, size).lineTo(x + size, bottom).arcTo(x + dir, bottom - dir, x, bottom - size, size).closePath();
    }
    /**
   * Draw Rectangle with chamfer corners. These are angled corners.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param chamfer - non-zero real number, size of corner cutout
   * @param transform
   */ chamferRect(x, y, width, height, chamfer, transform) {
        if (chamfer <= 0) {
            return this.rect(x, y, width, height);
        }
        const inset = Math.min(chamfer, Math.min(width, height) / 2);
        const right = x + width;
        const bottom = y + height;
        const points = [
            x + inset,
            y,
            right - inset,
            y,
            right,
            y + inset,
            right,
            bottom - inset,
            right - inset,
            bottom,
            x + inset,
            bottom,
            x,
            bottom - inset,
            x,
            y + inset
        ];
        for(let i = points.length - 1; i >= 2; i -= 2){
            if (points[i] === points[i - 2] && points[i - 1] === points[i - 3]) {
                points.splice(i - 1, 2);
            }
        }
        return this.poly(points, true, transform);
    }
    /**
   * Draws an ellipse at the specified location and with the given x and y radii.
   * An optional transformation can be applied, allowing for rotation, scaling, and translation.
   * @param x - The x-coordinate of the center of the ellipse.
   * @param y - The y-coordinate of the center of the ellipse.
   * @param radiusX - The horizontal radius of the ellipse.
   * @param radiusY - The vertical radius of the ellipse.
   * @param transform - An optional `Matrix` object to apply a transformation to the ellipse. This can include rotations.
   * @returns The instance of the current object for chaining.
   */ ellipse(x, y, radiusX, radiusY, transform) {
        this.drawShape(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Ellipse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Ellipse"](x, y, radiusX, radiusY), transform);
        return this;
    }
    /**
   * Draws a rectangle with rounded corners.
   * The corner radius can be specified to determine how rounded the corners should be.
   * An optional transformation can be applied, which allows for rotation, scaling, and translation of the rectangle.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param radius - The radius of the rectangle's corners. If not specified, corners will be sharp.
   * @param transform - An optional `Matrix` object to apply a transformation to the rectangle.
   * @returns The instance of the current object for chaining.
   */ roundRect(x, y, w, h, radius, transform) {
        this.drawShape(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$RoundedRectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoundedRectangle"](x, y, w, h, radius), transform);
        return this;
    }
    /**
   * Draws a given shape on the canvas.
   * This is a generic method that can draw any type of shape specified by the `ShapePrimitive` parameter.
   * An optional transformation matrix can be applied to the shape, allowing for complex transformations.
   * @param shape - The shape to draw, defined as a `ShapePrimitive` object.
   * @param matrix - An optional `Matrix` for transforming the shape. This can include rotations,
   * scaling, and translations.
   * @returns The instance of the current object for chaining.
   */ drawShape(shape, matrix) {
        this.endPoly();
        this.shapePrimitives.push({
            shape,
            transform: matrix
        });
        return this;
    }
    /**
   * Starts a new polygon path from the specified starting point.
   * This method initializes a new polygon or ends the current one if it exists.
   * @param x - The x-coordinate of the starting point of the new polygon.
   * @param y - The y-coordinate of the starting point of the new polygon.
   * @returns The instance of the current object for chaining.
   */ startPoly(x, y) {
        let currentPoly = this._currentPoly;
        if (currentPoly) {
            this.endPoly();
        }
        currentPoly = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Polygon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Polygon"]();
        currentPoly.points.push(x, y);
        this._currentPoly = currentPoly;
        return this;
    }
    /**
   * Ends the current polygon path. If `closePath` is set to true,
   * the path is closed by connecting the last point to the first one.
   * This method finalizes the current polygon and prepares it for drawing or adding to the shape primitives.
   * @param closePath - A boolean indicating whether to close the polygon by connecting the last point
   *  back to the starting point. False by default.
   * @returns The instance of the current object for chaining.
   */ endPoly() {
        let closePath = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        const shape = this._currentPoly;
        if (shape && shape.points.length > 2) {
            shape.closePath = closePath;
            this.shapePrimitives.push({
                shape
            });
        }
        this._currentPoly = null;
        return this;
    }
    _ensurePoly() {
        let start = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
        if (this._currentPoly) return;
        this._currentPoly = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Polygon$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Polygon"]();
        if (start) {
            const lastShape = this.shapePrimitives[this.shapePrimitives.length - 1];
            if (lastShape) {
                let lx = lastShape.shape.x;
                let ly = lastShape.shape.y;
                if (lastShape.transform && !lastShape.transform.isIdentity()) {
                    const t = lastShape.transform;
                    const tempX = lx;
                    lx = t.a * lx + t.c * ly + t.tx;
                    ly = t.b * tempX + t.d * ly + t.ty;
                }
                this._currentPoly.points.push(lx, ly);
            } else {
                this._currentPoly.points.push(0, 0);
            }
        }
    }
    /** Builds the path. */ buildPath() {
        const path = this._graphicsPath2D;
        this.shapePrimitives.length = 0;
        this._currentPoly = null;
        for(let i = 0; i < path.instructions.length; i++){
            const instruction = path.instructions[i];
            this[instruction.action](...instruction.data);
        }
        this.finish();
    }
    /** Gets the bounds of the path. */ get bounds() {
        const bounds = this._bounds;
        bounds.clear();
        const shapePrimitives = this.shapePrimitives;
        for(let i = 0; i < shapePrimitives.length; i++){
            const shapePrimitive = shapePrimitives[i];
            const boundsRect = shapePrimitive.shape.getBounds(tempRectangle);
            if (shapePrimitive.transform) {
                bounds.addRect(boundsRect, shapePrimitive.transform);
            } else {
                bounds.addRect(boundsRect);
            }
        }
        return bounds;
    }
    constructor(graphicsPath2D){
        /** The list of shape primitives that make up the path. */ this.shapePrimitives = [];
        this._currentPoly = null;
        this._bounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Bounds"]();
        this._graphicsPath2D = graphicsPath2D;
        this.signed = graphicsPath2D.checkForHoles;
    }
}
;
 //# sourceMappingURL=ShapePath.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/path/GraphicsPath.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GraphicsPath",
    ()=>GraphicsPath
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/Point.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/parseSVGPath.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$ShapePath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/path/ShapePath.mjs [app-client] (ecmascript)");
;
;
;
;
;
"use strict";
class GraphicsPath {
    /**
   * Provides access to the internal shape path, ensuring it is up-to-date with the current instructions.
   * @returns The `ShapePath` instance associated with this `GraphicsPath`.
   */ get shapePath() {
        if (!this._shapePath) {
            this._shapePath = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$ShapePath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShapePath"](this);
        }
        if (this._dirty) {
            this._dirty = false;
            this._shapePath.buildPath();
        }
        return this._shapePath;
    }
    /**
   * Adds another `GraphicsPath` to this path, optionally applying a transformation.
   * @param path - The `GraphicsPath` to add.
   * @param transform - An optional transformation to apply to the added path.
   * @returns The instance of the current object for chaining.
   */ addPath(path, transform) {
        path = path.clone();
        this.instructions.push({
            action: "addPath",
            data: [
                path,
                transform
            ]
        });
        this._dirty = true;
        return this;
    }
    arc() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "arc",
            data: args
        });
        this._dirty = true;
        return this;
    }
    arcTo() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "arcTo",
            data: args
        });
        this._dirty = true;
        return this;
    }
    arcToSvg() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "arcToSvg",
            data: args
        });
        this._dirty = true;
        return this;
    }
    bezierCurveTo() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "bezierCurveTo",
            data: args
        });
        this._dirty = true;
        return this;
    }
    /**
   * Adds a cubic Bezier curve to the path.
   * It requires two points: the second control point and the end point. The first control point is assumed to be
   * The starting point is the last point in the current path.
   * @param cp2x - The x-coordinate of the second control point.
   * @param cp2y - The y-coordinate of the second control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */ bezierCurveToShort(cp2x, cp2y, x, y, smoothness) {
        const last = this.instructions[this.instructions.length - 1];
        const lastPoint = this.getLastPoint(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"].shared);
        let cp1x = 0;
        let cp1y = 0;
        if (!last || last.action !== "bezierCurveTo") {
            cp1x = lastPoint.x;
            cp1y = lastPoint.y;
        } else {
            cp1x = last.data[2];
            cp1y = last.data[3];
            const currentX = lastPoint.x;
            const currentY = lastPoint.y;
            cp1x = currentX + (currentX - cp1x);
            cp1y = currentY + (currentY - cp1y);
        }
        this.instructions.push({
            action: "bezierCurveTo",
            data: [
                cp1x,
                cp1y,
                cp2x,
                cp2y,
                x,
                y,
                smoothness
            ]
        });
        this._dirty = true;
        return this;
    }
    /**
   * Closes the current path by drawing a straight line back to the start.
   * If the shape is already closed or there are no points in the path, this method does nothing.
   * @returns The instance of the current object for chaining.
   */ closePath() {
        this.instructions.push({
            action: "closePath",
            data: []
        });
        this._dirty = true;
        return this;
    }
    ellipse() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "ellipse",
            data: args
        });
        this._dirty = true;
        return this;
    }
    lineTo() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "lineTo",
            data: args
        });
        this._dirty = true;
        return this;
    }
    moveTo() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "moveTo",
            data: args
        });
        return this;
    }
    quadraticCurveTo() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "quadraticCurveTo",
            data: args
        });
        this._dirty = true;
        return this;
    }
    /**
   * Adds a quadratic curve to the path. It uses the previous point as the control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */ quadraticCurveToShort(x, y, smoothness) {
        const last = this.instructions[this.instructions.length - 1];
        const lastPoint = this.getLastPoint(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"].shared);
        let cpx1 = 0;
        let cpy1 = 0;
        if (!last || last.action !== "quadraticCurveTo") {
            cpx1 = lastPoint.x;
            cpy1 = lastPoint.y;
        } else {
            cpx1 = last.data[0];
            cpy1 = last.data[1];
            const currentX = lastPoint.x;
            const currentY = lastPoint.y;
            cpx1 = currentX + (currentX - cpx1);
            cpy1 = currentY + (currentY - cpy1);
        }
        this.instructions.push({
            action: "quadraticCurveTo",
            data: [
                cpx1,
                cpy1,
                x,
                y,
                smoothness
            ]
        });
        this._dirty = true;
        return this;
    }
    /**
   * Draws a rectangle shape. This method adds a new rectangle path to the current drawing.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param transform - An optional `Matrix` object to apply a transformation to the rectangle.
   * @returns The instance of the current object for chaining.
   */ rect(x, y, w, h, transform) {
        this.instructions.push({
            action: "rect",
            data: [
                x,
                y,
                w,
                h,
                transform
            ]
        });
        this._dirty = true;
        return this;
    }
    /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @param transform - An optional `Matrix` object to apply a transformation to the circle.
   * @returns The instance of the current object for chaining.
   */ circle(x, y, radius, transform) {
        this.instructions.push({
            action: "circle",
            data: [
                x,
                y,
                radius,
                transform
            ]
        });
        this._dirty = true;
        return this;
    }
    roundRect() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "roundRect",
            data: args
        });
        this._dirty = true;
        return this;
    }
    poly() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "poly",
            data: args
        });
        this._dirty = true;
        return this;
    }
    regularPoly() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "regularPoly",
            data: args
        });
        this._dirty = true;
        return this;
    }
    roundPoly() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "roundPoly",
            data: args
        });
        this._dirty = true;
        return this;
    }
    roundShape() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "roundShape",
            data: args
        });
        this._dirty = true;
        return this;
    }
    filletRect() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "filletRect",
            data: args
        });
        this._dirty = true;
        return this;
    }
    chamferRect() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        this.instructions.push({
            action: "chamferRect",
            data: args
        });
        this._dirty = true;
        return this;
    }
    /**
   * Draws a star shape centered at a specified location. This method allows for the creation
   *  of stars with a variable number of points, outer radius, optional inner radius, and rotation.
   * The star is drawn as a closed polygon with alternating outer and inner vertices to create the star's points.
   * An optional transformation can be applied to scale, rotate, or translate the star as needed.
   * @param x - The x-coordinate of the center of the star.
   * @param y - The y-coordinate of the center of the star.
   * @param points - The number of points of the star.
   * @param radius - The outer radius of the star (distance from the center to the outer points).
   * @param innerRadius - Optional. The inner radius of the star
   * (distance from the center to the inner points between the outer points).
   * If not provided, defaults to half of the `radius`.
   * @param rotation - Optional. The rotation of the star in radians, where 0 is aligned with the y-axis.
   * Defaults to 0, meaning one point is directly upward.
   * @param transform - An optional `Matrix` object to apply a transformation to the star.
   * This can include rotations, scaling, and translations.
   * @returns The instance of the current object for chaining further drawing commands.
   */ // eslint-disable-next-line max-len
    star(x, y, points, radius, innerRadius, rotation, transform) {
        innerRadius || (innerRadius = radius / 2);
        const startAngle = -1 * Math.PI / 2 + rotation;
        const len = points * 2;
        const delta = Math.PI * 2 / len;
        const polygon = [];
        for(let i = 0; i < len; i++){
            const r = i % 2 ? innerRadius : radius;
            const angle = i * delta + startAngle;
            polygon.push(x + r * Math.cos(angle), y + r * Math.sin(angle));
        }
        this.poly(polygon, true, transform);
        return this;
    }
    /**
   * Creates a copy of the current `GraphicsPath` instance. This method supports both shallow and deep cloning.
   * A shallow clone copies the reference of the instructions array, while a deep clone creates a new array and
   * copies each instruction individually, ensuring that modifications to the instructions of the cloned `GraphicsPath`
   * do not affect the original `GraphicsPath` and vice versa.
   * @param deep - A boolean flag indicating whether the clone should be deep.
   * @returns A new `GraphicsPath` instance that is a clone of the current instance.
   */ clone() {
        let deep = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        const newGraphicsPath2D = new GraphicsPath();
        newGraphicsPath2D.checkForHoles = this.checkForHoles;
        if (!deep) {
            newGraphicsPath2D.instructions = this.instructions.slice();
        } else {
            for(let i = 0; i < this.instructions.length; i++){
                const instruction = this.instructions[i];
                newGraphicsPath2D.instructions.push({
                    action: instruction.action,
                    data: instruction.data.slice()
                });
            }
        }
        return newGraphicsPath2D;
    }
    clear() {
        this.instructions.length = 0;
        this._dirty = true;
        return this;
    }
    /**
   * Applies a transformation matrix to all drawing instructions within the `GraphicsPath`.
   * This method enables the modification of the path's geometry according to the provided
   * transformation matrix, which can include translations, rotations, scaling, and skewing.
   *
   * Each drawing instruction in the path is updated to reflect the transformation,
   * ensuring the visual representation of the path is consistent with the applied matrix.
   *
   * Note: The transformation is applied directly to the coordinates and control points of the drawing instructions,
   * not to the path as a whole. This means the transformation's effects are baked into the individual instructions,
   * allowing for fine-grained control over the path's appearance.
   * @param matrix - A `Matrix` object representing the transformation to apply.
   * @returns The instance of the current object for chaining further operations.
   */ transform(matrix) {
        if (matrix.isIdentity()) return this;
        const a = matrix.a;
        const b = matrix.b;
        const c = matrix.c;
        const d = matrix.d;
        const tx = matrix.tx;
        const ty = matrix.ty;
        let x = 0;
        let y = 0;
        let cpx1 = 0;
        let cpy1 = 0;
        let cpx2 = 0;
        let cpy2 = 0;
        let rx = 0;
        let ry = 0;
        for(let i = 0; i < this.instructions.length; i++){
            const instruction = this.instructions[i];
            const data = instruction.data;
            switch(instruction.action){
                case "moveTo":
                case "lineTo":
                    x = data[0];
                    y = data[1];
                    data[0] = a * x + c * y + tx;
                    data[1] = b * x + d * y + ty;
                    break;
                case "bezierCurveTo":
                    cpx1 = data[0];
                    cpy1 = data[1];
                    cpx2 = data[2];
                    cpy2 = data[3];
                    x = data[4];
                    y = data[5];
                    data[0] = a * cpx1 + c * cpy1 + tx;
                    data[1] = b * cpx1 + d * cpy1 + ty;
                    data[2] = a * cpx2 + c * cpy2 + tx;
                    data[3] = b * cpx2 + d * cpy2 + ty;
                    data[4] = a * x + c * y + tx;
                    data[5] = b * x + d * y + ty;
                    break;
                case "quadraticCurveTo":
                    cpx1 = data[0];
                    cpy1 = data[1];
                    x = data[2];
                    y = data[3];
                    data[0] = a * cpx1 + c * cpy1 + tx;
                    data[1] = b * cpx1 + d * cpy1 + ty;
                    data[2] = a * x + c * y + tx;
                    data[3] = b * x + d * y + ty;
                    break;
                case "arcToSvg":
                    x = data[5];
                    y = data[6];
                    rx = data[0];
                    ry = data[1];
                    data[0] = a * rx + c * ry;
                    data[1] = b * rx + d * ry;
                    data[5] = a * x + c * y + tx;
                    data[6] = b * x + d * y + ty;
                    break;
                case "circle":
                    data[4] = adjustTransform(data[3], matrix);
                    break;
                case "rect":
                    data[4] = adjustTransform(data[4], matrix);
                    break;
                case "ellipse":
                    data[8] = adjustTransform(data[8], matrix);
                    break;
                case "roundRect":
                    data[5] = adjustTransform(data[5], matrix);
                    break;
                case "addPath":
                    data[0].transform(matrix);
                    break;
                case "poly":
                    data[2] = adjustTransform(data[2], matrix);
                    break;
                default:
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])("unknown transform action", instruction.action);
                    break;
            }
        }
        this._dirty = true;
        return this;
    }
    get bounds() {
        return this.shapePath.bounds;
    }
    /**
   * Retrieves the last point from the current drawing instructions in the `GraphicsPath`.
   * This method is useful for operations that depend on the path's current endpoint,
   * such as connecting subsequent shapes or paths. It supports various drawing instructions,
   * ensuring the last point's position is accurately determined regardless of the path's complexity.
   *
   * If the last instruction is a `closePath`, the method iterates backward through the instructions
   *  until it finds an actionable instruction that defines a point (e.g., `moveTo`, `lineTo`,
   * `quadraticCurveTo`, etc.). For compound paths added via `addPath`, it recursively retrieves
   * the last point from the nested path.
   * @param out - A `Point` object where the last point's coordinates will be stored.
   * This object is modified directly to contain the result.
   * @returns The `Point` object containing the last point's coordinates.
   */ getLastPoint(out) {
        let index = this.instructions.length - 1;
        let lastInstruction = this.instructions[index];
        if (!lastInstruction) {
            out.x = 0;
            out.y = 0;
            return out;
        }
        while(lastInstruction.action === "closePath"){
            index--;
            if (index < 0) {
                out.x = 0;
                out.y = 0;
                return out;
            }
            lastInstruction = this.instructions[index];
        }
        switch(lastInstruction.action){
            case "moveTo":
            case "lineTo":
                out.x = lastInstruction.data[0];
                out.y = lastInstruction.data[1];
                break;
            case "quadraticCurveTo":
                out.x = lastInstruction.data[2];
                out.y = lastInstruction.data[3];
                break;
            case "bezierCurveTo":
                out.x = lastInstruction.data[4];
                out.y = lastInstruction.data[5];
                break;
            case "arc":
            case "arcToSvg":
                out.x = lastInstruction.data[5];
                out.y = lastInstruction.data[6];
                break;
            case "addPath":
                lastInstruction.data[0].getLastPoint(out);
                break;
        }
        return out;
    }
    /**
   * Creates a `GraphicsPath` instance optionally from an SVG path string or an array of `PathInstruction`.
   * @param instructions - An SVG path string or an array of `PathInstruction` objects.
   * @param signed
   */ constructor(instructions, signed = false){
        this.instructions = [];
        /** unique id for this graphics path */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("graphicsPath");
        this._dirty = true;
        this.checkForHoles = signed;
        if (typeof instructions === "string") {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGPath"])(instructions, this);
        } else {
            var _instructions_slice;
            this.instructions = (_instructions_slice = instructions === null || instructions === void 0 ? void 0 : instructions.slice()) !== null && _instructions_slice !== void 0 ? _instructions_slice : [];
        }
    }
}
function adjustTransform(currentMatrix, transform) {
    if (currentMatrix) {
        return currentMatrix.prepend(transform);
    }
    return transform.clone();
}
;
 //# sourceMappingURL=GraphicsPath.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/parseSVGFloatAttribute.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseSVGFloatAttribute",
    ()=>parseSVGFloatAttribute
]);
"use strict";
function parseSVGFloatAttribute(svg, id, defaultValue) {
    const value = svg.getAttribute(id);
    return value ? Number(value) : defaultValue;
}
;
 //# sourceMappingURL=parseSVGFloatAttribute.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/parseSVGDefinitions.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseSVGDefinitions",
    ()=>parseSVGDefinitions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/fill/FillGradient.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/parseSVGFloatAttribute.mjs [app-client] (ecmascript)");
;
;
;
;
"use strict";
function parseSVGDefinitions(svg, session) {
    const definitions = svg.querySelectorAll("defs");
    for(let i = 0; i < definitions.length; i++){
        const definition = definitions[i];
        for(let j = 0; j < definition.children.length; j++){
            const child = definition.children[j];
            switch(child.nodeName.toLowerCase()){
                case "lineargradient":
                    session.defs[child.id] = parseLinearGradient(child);
                    break;
                case "radialgradient":
                    session.defs[child.id] = parseRadialGradient(child);
                    break;
                default:
                    break;
            }
        }
    }
}
function parseLinearGradient(child) {
    const x0 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(child, "x1", 0);
    const y0 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(child, "y1", 0);
    const x1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(child, "x2", 1);
    const y1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(child, "y2", 0);
    const gradientUnit = child.getAttribute("gradientUnits") || "objectBoundingBox";
    const gradient = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillGradient"](x0, y0, x1, y1, gradientUnit === "objectBoundingBox" ? "local" : "global");
    for(let k = 0; k < child.children.length; k++){
        const stop = child.children[k];
        const offset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(stop, "offset", 0);
        const color = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(stop.getAttribute("stop-color")).toNumber();
        gradient.addColorStop(offset, color);
    }
    return gradient;
}
function parseRadialGradient(_child) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])("[SVG Parser] Radial gradients are not yet supported");
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillGradient"](0, 0, 1, 0);
}
;
 //# sourceMappingURL=parseSVGDefinitions.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/utils/extractSvgUrlId.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extractSvgUrlId",
    ()=>extractSvgUrlId
]);
"use strict";
function extractSvgUrlId(url) {
    const match = url.match(/url\s*\(\s*['"]?\s*#([^'"\s)]+)\s*['"]?\s*\)/i);
    return match ? match[1] : "";
}
;
 //# sourceMappingURL=extractSvgUrlId.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/parseSVGStyle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseSVGStyle",
    ()=>parseSVGStyle,
    "styleAttributes",
    ()=>styleAttributes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$utils$2f$extractSvgUrlId$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/utils/extractSvgUrlId.mjs [app-client] (ecmascript)");
;
;
"use strict";
const styleAttributes = {
    // Fill properties
    fill: {
        type: "paint",
        default: 0
    },
    // Fill color/gradient
    "fill-opacity": {
        type: "number",
        default: 1
    },
    // Fill transparency
    // Stroke properties
    stroke: {
        type: "paint",
        default: 0
    },
    // Stroke color/gradient
    "stroke-width": {
        type: "number",
        default: 1
    },
    // Width of stroke
    "stroke-opacity": {
        type: "number",
        default: 1
    },
    // Stroke transparency
    "stroke-linecap": {
        type: "string",
        default: "butt"
    },
    // End cap style: butt, round, square
    "stroke-linejoin": {
        type: "string",
        default: "miter"
    },
    // Join style: miter, round, bevel
    "stroke-miterlimit": {
        type: "number",
        default: 10
    },
    // Limit on miter join sharpness
    "stroke-dasharray": {
        type: "string",
        default: "none"
    },
    // Dash pattern
    "stroke-dashoffset": {
        type: "number",
        default: 0
    },
    // Offset for dash pattern
    // Global properties
    opacity: {
        type: "number",
        default: 1
    }
};
function parseSVGStyle(svg, session) {
    const style = svg.getAttribute("style");
    const strokeStyle = {};
    const fillStyle = {};
    const result = {
        strokeStyle,
        fillStyle,
        useFill: false,
        useStroke: false
    };
    for(const key in styleAttributes){
        const attribute = svg.getAttribute(key);
        if (attribute) {
            parseAttribute(session, result, key, attribute.trim());
        }
    }
    if (style) {
        const styleParts = style.split(";");
        for(let i = 0; i < styleParts.length; i++){
            const stylePart = styleParts[i].trim();
            const [key, value] = stylePart.split(":");
            if (styleAttributes[key]) {
                parseAttribute(session, result, key, value.trim());
            }
        }
    }
    return {
        strokeStyle: result.useStroke ? strokeStyle : null,
        fillStyle: result.useFill ? fillStyle : null,
        useFill: result.useFill,
        useStroke: result.useStroke
    };
}
function parseAttribute(session, result, id, value) {
    switch(id){
        case "stroke":
            if (value !== "none") {
                if (value.startsWith("url(")) {
                    const id2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$utils$2f$extractSvgUrlId$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractSvgUrlId"])(value);
                    result.strokeStyle.fill = session.defs[id2];
                } else {
                    result.strokeStyle.color = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(value).toNumber();
                }
                result.useStroke = true;
            }
            break;
        case "stroke-width":
            result.strokeStyle.width = Number(value);
            break;
        case "fill":
            if (value !== "none") {
                if (value.startsWith("url(")) {
                    const id2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$utils$2f$extractSvgUrlId$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractSvgUrlId"])(value);
                    result.fillStyle.fill = session.defs[id2];
                } else {
                    result.fillStyle.color = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(value).toNumber();
                }
                result.useFill = true;
            }
            break;
        case "fill-opacity":
            result.fillStyle.alpha = Number(value);
            break;
        case "stroke-opacity":
            result.strokeStyle.alpha = Number(value);
            break;
        case "opacity":
            result.fillStyle.alpha = Number(value);
            result.strokeStyle.alpha = Number(value);
            break;
    }
}
;
 //# sourceMappingURL=parseSVGStyle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/utils/fillOperations.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkForNestedPattern",
    ()=>checkForNestedPattern,
    "getFillInstructionData",
    ()=>getFillInstructionData
]);
"use strict";
function checkForNestedPattern(subpathsWithArea) {
    if (subpathsWithArea.length <= 2) {
        return true;
    }
    const areas = subpathsWithArea.map((s)=>s.area).sort((a, b)=>b - a);
    const [largestArea, secondArea] = areas;
    const smallestArea = areas[areas.length - 1];
    const largestToSecondRatio = largestArea / secondArea;
    const secondToSmallestRatio = secondArea / smallestArea;
    if (largestToSecondRatio > 3 && secondToSmallestRatio < 2) {
        return false;
    }
    return true;
}
function getFillInstructionData(context) {
    let index = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    const instruction = context.instructions[index];
    if (!instruction || instruction.action !== "fill") {
        throw new Error("Expected fill instruction at index ".concat(index, ", got ").concat((instruction === null || instruction === void 0 ? void 0 : instruction.action) || "undefined"));
    }
    return instruction.data;
}
;
 //# sourceMappingURL=fillOperations.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/utils/pathOperations.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "appendSVGPath",
    ()=>appendSVGPath,
    "calculatePathArea",
    ()=>calculatePathArea,
    "extractSubpaths",
    ()=>extractSubpaths
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$GraphicsPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/path/GraphicsPath.mjs [app-client] (ecmascript)");
;
"use strict";
function extractSubpaths(pathData) {
    const parts = pathData.split(/(?=[Mm])/);
    const subpaths = parts.filter((part)=>part.trim().length > 0);
    return subpaths;
}
function calculatePathArea(pathData) {
    const coords = pathData.match(/[-+]?[0-9]*\.?[0-9]+/g);
    if (!coords || coords.length < 4) return 0;
    const numbers = coords.map(Number);
    const xs = [];
    const ys = [];
    for(let i = 0; i < numbers.length; i += 2){
        if (i + 1 < numbers.length) {
            xs.push(numbers[i]);
            ys.push(numbers[i + 1]);
        }
    }
    if (xs.length === 0 || ys.length === 0) return 0;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const area = (maxX - minX) * (maxY - minY);
    return area;
}
function appendSVGPath(pathData, graphicsPath) {
    const tempPath = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$GraphicsPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsPath"](pathData, false);
    for (const instruction of tempPath.instructions){
        graphicsPath.instructions.push(instruction);
    }
}
;
 //# sourceMappingURL=pathOperations.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/SVGParser.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SVGParser",
    ()=>SVGParser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$GraphicsPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/path/GraphicsPath.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGDefinitions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/parseSVGDefinitions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/parseSVGFloatAttribute.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/parseSVGStyle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$utils$2f$fillOperations$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/utils/fillOperations.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$utils$2f$pathOperations$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/utils/pathOperations.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
function SVGParser(svg, graphicsContext) {
    if (typeof svg === "string") {
        const div = document.createElement("div");
        div.innerHTML = svg.trim();
        svg = div.querySelector("svg");
    }
    const session = {
        context: graphicsContext,
        defs: {},
        path: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$GraphicsPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsPath"]()
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGDefinitions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGDefinitions"])(svg, session);
    const children = svg.children;
    const { fillStyle, strokeStyle } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGStyle"])(svg, session);
    for(let i = 0; i < children.length; i++){
        const child = children[i];
        if (child.nodeName.toLowerCase() === "defs") continue;
        renderChildren(child, session, fillStyle, strokeStyle);
    }
    return graphicsContext;
}
function renderChildren(svg, session, fillStyle, strokeStyle) {
    const children = svg.children;
    const { fillStyle: f1, strokeStyle: s1 } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGStyle"])(svg, session);
    if (f1 && fillStyle) {
        fillStyle = {
            ...fillStyle,
            ...f1
        };
    } else if (f1) {
        fillStyle = f1;
    }
    if (s1 && strokeStyle) {
        strokeStyle = {
            ...strokeStyle,
            ...s1
        };
    } else if (s1) {
        strokeStyle = s1;
    }
    const noStyle = !fillStyle && !strokeStyle;
    if (noStyle) {
        fillStyle = {
            color: 0
        };
    }
    let x;
    let y;
    let x1;
    let y1;
    let x2;
    let y2;
    let cx;
    let cy;
    let r;
    let rx;
    let ry;
    let points;
    let pointsString;
    let d;
    let graphicsPath;
    let width;
    let height;
    switch(svg.nodeName.toLowerCase()){
        case "path":
            {
                d = svg.getAttribute("d");
                const fillRule = svg.getAttribute("fill-rule");
                const subpaths = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$utils$2f$pathOperations$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractSubpaths"])(d);
                const hasExplicitEvenodd = fillRule === "evenodd";
                const hasMultipleSubpaths = subpaths.length > 1;
                const shouldProcessHoles = hasExplicitEvenodd && hasMultipleSubpaths;
                if (shouldProcessHoles) {
                    const subpathsWithArea = subpaths.map((subpath)=>({
                            path: subpath,
                            area: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$utils$2f$pathOperations$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculatePathArea"])(subpath)
                        }));
                    subpathsWithArea.sort((a, b)=>b.area - a.area);
                    const useMultipleHolesApproach = subpaths.length > 3 || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$utils$2f$fillOperations$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["checkForNestedPattern"])(subpathsWithArea);
                    if (useMultipleHolesApproach) {
                        for(let i = 0; i < subpathsWithArea.length; i++){
                            const subpath = subpathsWithArea[i];
                            const isMainShape = i === 0;
                            session.context.beginPath();
                            const newPath = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$GraphicsPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsPath"](void 0, true);
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$utils$2f$pathOperations$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendSVGPath"])(subpath.path, newPath);
                            session.context.path(newPath);
                            if (isMainShape) {
                                if (fillStyle) session.context.fill(fillStyle);
                                if (strokeStyle) session.context.stroke(strokeStyle);
                            } else {
                                session.context.cut();
                            }
                        }
                    } else {
                        for(let i = 0; i < subpathsWithArea.length; i++){
                            const subpath = subpathsWithArea[i];
                            const isHole = i % 2 === 1;
                            session.context.beginPath();
                            const newPath = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$GraphicsPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsPath"](void 0, true);
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$utils$2f$pathOperations$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendSVGPath"])(subpath.path, newPath);
                            session.context.path(newPath);
                            if (isHole) {
                                session.context.cut();
                            } else {
                                if (fillStyle) session.context.fill(fillStyle);
                                if (strokeStyle) session.context.stroke(strokeStyle);
                            }
                        }
                    }
                } else {
                    const useEvenoddForGraphicsPath = fillRule ? fillRule === "evenodd" : true;
                    graphicsPath = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$GraphicsPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsPath"](d, useEvenoddForGraphicsPath);
                    session.context.path(graphicsPath);
                    if (fillStyle) session.context.fill(fillStyle);
                    if (strokeStyle) session.context.stroke(strokeStyle);
                }
                break;
            }
        case "circle":
            cx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "cx", 0);
            cy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "cy", 0);
            r = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "r", 0);
            session.context.ellipse(cx, cy, r, r);
            if (fillStyle) session.context.fill(fillStyle);
            if (strokeStyle) session.context.stroke(strokeStyle);
            break;
        case "rect":
            x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "x", 0);
            y = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "y", 0);
            width = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "width", 0);
            height = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "height", 0);
            rx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "rx", 0);
            ry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "ry", 0);
            if (rx || ry) {
                session.context.roundRect(x, y, width, height, rx || ry);
            } else {
                session.context.rect(x, y, width, height);
            }
            if (fillStyle) session.context.fill(fillStyle);
            if (strokeStyle) session.context.stroke(strokeStyle);
            break;
        case "ellipse":
            cx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "cx", 0);
            cy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "cy", 0);
            rx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "rx", 0);
            ry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "ry", 0);
            session.context.beginPath();
            session.context.ellipse(cx, cy, rx, ry);
            if (fillStyle) session.context.fill(fillStyle);
            if (strokeStyle) session.context.stroke(strokeStyle);
            break;
        case "line":
            x1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "x1", 0);
            y1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "y1", 0);
            x2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "x2", 0);
            y2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$parseSVGFloatAttribute$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseSVGFloatAttribute"])(svg, "y2", 0);
            session.context.beginPath();
            session.context.moveTo(x1, y1);
            session.context.lineTo(x2, y2);
            if (strokeStyle) session.context.stroke(strokeStyle);
            break;
        case "polygon":
            pointsString = svg.getAttribute("points");
            points = pointsString.match(/\d+/g).map((n)=>parseInt(n, 10));
            session.context.poly(points, true);
            if (fillStyle) session.context.fill(fillStyle);
            if (strokeStyle) session.context.stroke(strokeStyle);
            break;
        case "polyline":
            pointsString = svg.getAttribute("points");
            points = pointsString.match(/\d+/g).map((n)=>parseInt(n, 10));
            session.context.poly(points, false);
            if (strokeStyle) session.context.stroke(strokeStyle);
            break;
        case "g":
        case "svg":
            break;
        default:
            {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])("[SVG parser] <".concat(svg.nodeName, "> elements unsupported"));
                break;
            }
    }
    if (noStyle) {
        fillStyle = null;
    }
    for(let i = 0; i < children.length; i++){
        renderChildren(children[i], session, fillStyle, strokeStyle);
    }
}
;
 //# sourceMappingURL=SVGParser.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/convertFillInputToFillStyle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toFillStyle",
    ()=>toFillStyle,
    "toStrokeStyle",
    ()=>toStrokeStyle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/fill/FillGradient.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillPattern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/fill/FillPattern.mjs [app-client] (ecmascript)");
;
;
;
;
"use strict";
function isColorLike(value) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].isColorLike(value);
}
function isFillPattern(value) {
    return value instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillPattern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillPattern"];
}
function isFillGradient(value) {
    return value instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillGradient"];
}
function isTexture(value) {
    return value instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"];
}
function handleColorLike(fill, value, defaultStyle) {
    const temp = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(value !== null && value !== void 0 ? value : 0);
    fill.color = temp.toNumber();
    fill.alpha = temp.alpha === 1 ? defaultStyle.alpha : temp.alpha;
    fill.texture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].WHITE;
    return {
        ...defaultStyle,
        ...fill
    };
}
function handleTexture(fill, value, defaultStyle) {
    fill.texture = value;
    return {
        ...defaultStyle,
        ...fill
    };
}
function handleFillPattern(fill, value, defaultStyle) {
    fill.fill = value;
    fill.color = 16777215;
    fill.texture = value.texture;
    fill.matrix = value.transform;
    return {
        ...defaultStyle,
        ...fill
    };
}
function handleFillGradient(fill, value, defaultStyle) {
    value.buildGradient();
    fill.fill = value;
    fill.color = 16777215;
    fill.texture = value.texture;
    fill.matrix = value.transform;
    fill.textureSpace = value.textureSpace;
    return {
        ...defaultStyle,
        ...fill
    };
}
function handleFillObject(value, defaultStyle) {
    const style = {
        ...defaultStyle,
        ...value
    };
    const color = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(style.color);
    style.alpha *= color.alpha;
    style.color = color.toNumber();
    return style;
}
function toFillStyle(value, defaultStyle) {
    if (value === void 0 || value === null) {
        return null;
    }
    const fill = {};
    const objectStyle = value;
    if (isColorLike(value)) {
        return handleColorLike(fill, value, defaultStyle);
    } else if (isTexture(value)) {
        return handleTexture(fill, value, defaultStyle);
    } else if (isFillPattern(value)) {
        return handleFillPattern(fill, value, defaultStyle);
    } else if (isFillGradient(value)) {
        return handleFillGradient(fill, value, defaultStyle);
    } else if (objectStyle.fill && isFillPattern(objectStyle.fill)) {
        return handleFillPattern(objectStyle, objectStyle.fill, defaultStyle);
    } else if (objectStyle.fill && isFillGradient(objectStyle.fill)) {
        return handleFillGradient(objectStyle, objectStyle.fill, defaultStyle);
    }
    return handleFillObject(objectStyle, defaultStyle);
}
function toStrokeStyle(value, defaultStyle) {
    const { width, alignment, miterLimit, cap, join, pixelLine, ...rest } = defaultStyle;
    const fill = toFillStyle(value, rest);
    if (!fill) {
        return null;
    }
    return {
        width,
        alignment,
        miterLimit,
        cap,
        join,
        pixelLine,
        ...fill
    };
}
;
 //# sourceMappingURL=convertFillInputToFillStyle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/GraphicsContext.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GraphicsContext",
    ()=>GraphicsContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/Point.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$GraphicsPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/path/GraphicsPath.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$SVGParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/svg/SVGParser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/convertFillInputToFillStyle.mjs [app-client] (ecmascript)");
;
;
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
const tmpPoint = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"]();
const tempMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
const _GraphicsContext = class _GraphicsContext extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    /**
   * Creates a new GraphicsContext object that is a clone of this instance, copying all properties,
   * including the current drawing state, transformations, styles, and instructions.
   * @returns A new GraphicsContext instance with the same properties and state as this one.
   */ clone() {
        const clone = new _GraphicsContext();
        clone.batchMode = this.batchMode;
        clone.instructions = this.instructions.slice();
        clone._activePath = this._activePath.clone();
        clone._transform = this._transform.clone();
        clone._fillStyle = {
            ...this._fillStyle
        };
        clone._strokeStyle = {
            ...this._strokeStyle
        };
        clone._stateStack = this._stateStack.slice();
        clone._bounds = this._bounds.clone();
        clone._boundsDirty = true;
        return clone;
    }
    /**
   * The current fill style of the graphics context. This can be a color, gradient, pattern, or a more complex style defined by a FillStyle object.
   */ get fillStyle() {
        return this._fillStyle;
    }
    set fillStyle(value) {
        this._fillStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toFillStyle"])(value, _GraphicsContext.defaultFillStyle);
    }
    /**
   * The current stroke style of the graphics context. Similar to fill styles, stroke styles can encompass colors, gradients, patterns, or more detailed configurations via a StrokeStyle object.
   */ get strokeStyle() {
        return this._strokeStyle;
    }
    set strokeStyle(value) {
        this._strokeStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toStrokeStyle"])(value, _GraphicsContext.defaultStrokeStyle);
    }
    /**
   * Sets the current fill style of the graphics context. The fill style can be a color, gradient,
   * pattern, or a more complex style defined by a FillStyle object.
   * @param style - The fill style to apply. This can be a simple color, a gradient or pattern object,
   *                or a FillStyle or ConvertedFillStyle object.
   * @returns The instance of the current GraphicsContext for method chaining.
   */ setFillStyle(style) {
        this._fillStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toFillStyle"])(style, _GraphicsContext.defaultFillStyle);
        return this;
    }
    /**
   * Sets the current stroke style of the graphics context. Similar to fill styles, stroke styles can
   * encompass colors, gradients, patterns, or more detailed configurations via a StrokeStyle object.
   * @param style - The stroke style to apply. Can be defined as a color, a gradient or pattern,
   *                or a StrokeStyle or ConvertedStrokeStyle object.
   * @returns The instance of the current GraphicsContext for method chaining.
   */ setStrokeStyle(style) {
        this._strokeStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toFillStyle"])(style, _GraphicsContext.defaultStrokeStyle);
        return this;
    }
    texture(texture, tint, dx, dy, dw, dh) {
        this.instructions.push({
            action: "texture",
            data: {
                image: texture,
                dx: dx || 0,
                dy: dy || 0,
                dw: dw || texture.frame.width,
                dh: dh || texture.frame.height,
                transform: this._transform.clone(),
                alpha: this._fillStyle.alpha,
                style: tint ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(tint).toNumber() : 16777215
            }
        });
        this.onUpdate();
        return this;
    }
    /**
   * Resets the current path. Any previous path and its commands are discarded and a new path is
   * started. This is typically called before beginning a new shape or series of drawing commands.
   * @returns The instance of the current GraphicsContext for method chaining.
   */ beginPath() {
        this._activePath = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$GraphicsPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsPath"]();
        return this;
    }
    fill(style, alpha) {
        let path;
        const lastInstruction = this.instructions[this.instructions.length - 1];
        if (this._tick === 0 && lastInstruction && lastInstruction.action === "stroke") {
            path = lastInstruction.data.path;
        } else {
            path = this._activePath.clone();
        }
        if (!path) return this;
        if (style != null) {
            if (alpha !== void 0 && typeof style === "number") {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "GraphicsContext.fill(color, alpha) is deprecated, use GraphicsContext.fill({ color, alpha }) instead");
                style = {
                    color: style,
                    alpha
                };
            }
            this._fillStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toFillStyle"])(style, _GraphicsContext.defaultFillStyle);
        }
        this.instructions.push({
            action: "fill",
            // TODO copy fill style!
            data: {
                style: this.fillStyle,
                path
            }
        });
        this.onUpdate();
        this._initNextPathLocation();
        this._tick = 0;
        return this;
    }
    _initNextPathLocation() {
        const { x, y } = this._activePath.getLastPoint(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Point"].shared);
        this._activePath.clear();
        this._activePath.moveTo(x, y);
    }
    /**
   * Strokes the current path with the current stroke style. This method can take an optional
   * FillInput parameter to define the stroke's appearance, including its color, width, and other properties.
   * @param style - (Optional) The stroke style to apply. Can be defined as a simple color or a more complex style object. If omitted, uses the current stroke style.
   * @returns The instance of the current GraphicsContext for method chaining.
   */ stroke(style) {
        let path;
        const lastInstruction = this.instructions[this.instructions.length - 1];
        if (this._tick === 0 && lastInstruction && lastInstruction.action === "fill") {
            path = lastInstruction.data.path;
        } else {
            path = this._activePath.clone();
        }
        if (!path) return this;
        if (style != null) {
            this._strokeStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toStrokeStyle"])(style, _GraphicsContext.defaultStrokeStyle);
        }
        this.instructions.push({
            action: "stroke",
            // TODO copy fill style!
            data: {
                style: this.strokeStyle,
                path
            }
        });
        this.onUpdate();
        this._initNextPathLocation();
        this._tick = 0;
        return this;
    }
    /**
   * Applies a cutout to the last drawn shape. This is used to create holes or complex shapes by
   * subtracting a path from the previously drawn path. If a hole is not completely in a shape, it will
   * fail to cut correctly!
   * @returns The instance of the current GraphicsContext for method chaining.
   */ cut() {
        for(let i = 0; i < 2; i++){
            const lastInstruction = this.instructions[this.instructions.length - 1 - i];
            const holePath = this._activePath.clone();
            if (lastInstruction) {
                if (lastInstruction.action === "stroke" || lastInstruction.action === "fill") {
                    if (lastInstruction.data.hole) {
                        lastInstruction.data.hole.addPath(holePath);
                    } else {
                        lastInstruction.data.hole = holePath;
                        break;
                    }
                }
            }
        }
        this._initNextPathLocation();
        return this;
    }
    /**
   * Adds an arc to the current path, which is centered at (x, y) with the specified radius,
   * starting and ending angles, and direction.
   * @param x - The x-coordinate of the arc's center.
   * @param y - The y-coordinate of the arc's center.
   * @param radius - The arc's radius.
   * @param startAngle - The starting angle, in radians.
   * @param endAngle - The ending angle, in radians.
   * @param counterclockwise - (Optional) Specifies whether the arc is drawn counterclockwise (true) or clockwise (false). Defaults to false.
   * @returns The instance of the current GraphicsContext for method chaining.
   */ arc(x, y, radius, startAngle, endAngle, counterclockwise) {
        this._tick++;
        const t = this._transform;
        this._activePath.arc(t.a * x + t.c * y + t.tx, t.b * x + t.d * y + t.ty, radius, startAngle, endAngle, counterclockwise);
        return this;
    }
    /**
   * Adds an arc to the current path with the given control points and radius, connected to the previous point
   * by a straight line if necessary.
   * @param x1 - The x-coordinate of the first control point.
   * @param y1 - The y-coordinate of the first control point.
   * @param x2 - The x-coordinate of the second control point.
   * @param y2 - The y-coordinate of the second control point.
   * @param radius - The arc's radius.
   * @returns The instance of the current GraphicsContext for method chaining.
   */ arcTo(x1, y1, x2, y2, radius) {
        this._tick++;
        const t = this._transform;
        this._activePath.arcTo(t.a * x1 + t.c * y1 + t.tx, t.b * x1 + t.d * y1 + t.ty, t.a * x2 + t.c * y2 + t.tx, t.b * x2 + t.d * y2 + t.ty, radius);
        return this;
    }
    /**
   * Adds an SVG-style arc to the path, allowing for elliptical arcs based on the SVG spec.
   * @param rx - The x-radius of the ellipse.
   * @param ry - The y-radius of the ellipse.
   * @param xAxisRotation - The rotation of the ellipse's x-axis relative
   * to the x-axis of the coordinate system, in degrees.
   * @param largeArcFlag - Determines if the arc should be greater than or less than 180 degrees.
   * @param sweepFlag - Determines if the arc should be swept in a positive angle direction.
   * @param x - The x-coordinate of the arc's end point.
   * @param y - The y-coordinate of the arc's end point.
   * @returns The instance of the current object for chaining.
   */ arcToSvg(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
        this._tick++;
        const t = this._transform;
        this._activePath.arcToSvg(rx, ry, xAxisRotation, // should we rotate this with transform??
        largeArcFlag, sweepFlag, t.a * x + t.c * y + t.tx, t.b * x + t.d * y + t.ty);
        return this;
    }
    /**
   * Adds a cubic Bezier curve to the path.
   * It requires three points: the first two are control points and the third one is the end point.
   * The starting point is the last point in the current path.
   * @param cp1x - The x-coordinate of the first control point.
   * @param cp1y - The y-coordinate of the first control point.
   * @param cp2x - The x-coordinate of the second control point.
   * @param cp2y - The y-coordinate of the second control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */ bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y, smoothness) {
        this._tick++;
        const t = this._transform;
        this._activePath.bezierCurveTo(t.a * cp1x + t.c * cp1y + t.tx, t.b * cp1x + t.d * cp1y + t.ty, t.a * cp2x + t.c * cp2y + t.tx, t.b * cp2x + t.d * cp2y + t.ty, t.a * x + t.c * y + t.tx, t.b * x + t.d * y + t.ty, smoothness);
        return this;
    }
    /**
   * Closes the current path by drawing a straight line back to the start.
   * If the shape is already closed or there are no points in the path, this method does nothing.
   * @returns The instance of the current object for chaining.
   */ closePath() {
        var _this__activePath;
        this._tick++;
        (_this__activePath = this._activePath) === null || _this__activePath === void 0 ? void 0 : _this__activePath.closePath();
        return this;
    }
    /**
   * Draws an ellipse at the specified location and with the given x and y radii.
   * An optional transformation can be applied, allowing for rotation, scaling, and translation.
   * @param x - The x-coordinate of the center of the ellipse.
   * @param y - The y-coordinate of the center of the ellipse.
   * @param radiusX - The horizontal radius of the ellipse.
   * @param radiusY - The vertical radius of the ellipse.
   * @returns The instance of the current object for chaining.
   */ ellipse(x, y, radiusX, radiusY) {
        this._tick++;
        this._activePath.ellipse(x, y, radiusX, radiusY, this._transform.clone());
        return this;
    }
    /**
   * Draws a circle shape. This method adds a new circle path to the current drawing.
   * @param x - The x-coordinate of the center of the circle.
   * @param y - The y-coordinate of the center of the circle.
   * @param radius - The radius of the circle.
   * @returns The instance of the current object for chaining.
   */ circle(x, y, radius) {
        this._tick++;
        this._activePath.circle(x, y, radius, this._transform.clone());
        return this;
    }
    /**
   * Adds another `GraphicsPath` to this path, optionally applying a transformation.
   * @param path - The `GraphicsPath` to add.
   * @returns The instance of the current object for chaining.
   */ path(path) {
        this._tick++;
        this._activePath.addPath(path, this._transform.clone());
        return this;
    }
    /**
   * Connects the current point to a new point with a straight line. This method updates the current path.
   * @param x - The x-coordinate of the new point to connect to.
   * @param y - The y-coordinate of the new point to connect to.
   * @returns The instance of the current object for chaining.
   */ lineTo(x, y) {
        this._tick++;
        const t = this._transform;
        this._activePath.lineTo(t.a * x + t.c * y + t.tx, t.b * x + t.d * y + t.ty);
        return this;
    }
    /**
   * Sets the starting point for a new sub-path. Any subsequent drawing commands are considered part of this path.
   * @param x - The x-coordinate for the starting point.
   * @param y - The y-coordinate for the starting point.
   * @returns The instance of the current object for chaining.
   */ moveTo(x, y) {
        this._tick++;
        const t = this._transform;
        const instructions = this._activePath.instructions;
        const transformedX = t.a * x + t.c * y + t.tx;
        const transformedY = t.b * x + t.d * y + t.ty;
        if (instructions.length === 1 && instructions[0].action === "moveTo") {
            instructions[0].data[0] = transformedX;
            instructions[0].data[1] = transformedY;
            return this;
        }
        this._activePath.moveTo(transformedX, transformedY);
        return this;
    }
    /**
   * Adds a quadratic curve to the path. It requires two points: the control point and the end point.
   * The starting point is the last point in the current path.
   * @param cpx - The x-coordinate of the control point.
   * @param cpy - The y-coordinate of the control point.
   * @param x - The x-coordinate of the end point.
   * @param y - The y-coordinate of the end point.
   * @param smoothness - Optional parameter to adjust the smoothness of the curve.
   * @returns The instance of the current object for chaining.
   */ quadraticCurveTo(cpx, cpy, x, y, smoothness) {
        this._tick++;
        const t = this._transform;
        this._activePath.quadraticCurveTo(t.a * cpx + t.c * cpy + t.tx, t.b * cpx + t.d * cpy + t.ty, t.a * x + t.c * y + t.tx, t.b * x + t.d * y + t.ty, smoothness);
        return this;
    }
    /**
   * Draws a rectangle shape. This method adds a new rectangle path to the current drawing.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @returns The instance of the current object for chaining.
   */ rect(x, y, w, h) {
        this._tick++;
        this._activePath.rect(x, y, w, h, this._transform.clone());
        return this;
    }
    /**
   * Draws a rectangle with rounded corners.
   * The corner radius can be specified to determine how rounded the corners should be.
   * An optional transformation can be applied, which allows for rotation, scaling, and translation of the rectangle.
   * @param x - The x-coordinate of the top-left corner of the rectangle.
   * @param y - The y-coordinate of the top-left corner of the rectangle.
   * @param w - The width of the rectangle.
   * @param h - The height of the rectangle.
   * @param radius - The radius of the rectangle's corners. If not specified, corners will be sharp.
   * @returns The instance of the current object for chaining.
   */ roundRect(x, y, w, h, radius) {
        this._tick++;
        this._activePath.roundRect(x, y, w, h, radius, this._transform.clone());
        return this;
    }
    /**
   * Draws a polygon shape by specifying a sequence of points. This method allows for the creation of complex polygons,
   * which can be both open and closed. An optional transformation can be applied, enabling the polygon to be scaled,
   * rotated, or translated as needed.
   * @param points - An array of numbers, or an array of PointData objects eg [{x,y}, {x,y}, {x,y}]
   * representing the x and y coordinates, of the polygon's vertices, in sequence.
   * @param close - A boolean indicating whether to close the polygon path. True by default.
   */ poly(points, close) {
        this._tick++;
        this._activePath.poly(points, close, this._transform.clone());
        return this;
    }
    /**
   * Draws a regular polygon with a specified number of sides. All sides and angles are equal.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @param transform - An optional `Matrix` object to apply a transformation to the polygon.
   * @returns The instance of the current object for chaining.
   */ regularPoly(x, y, radius, sides) {
        let rotation = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 0, transform = arguments.length > 5 ? arguments[5] : void 0;
        this._tick++;
        this._activePath.regularPoly(x, y, radius, sides, rotation, transform);
        return this;
    }
    /**
   * Draws a polygon with rounded corners.
   * Similar to `regularPoly` but with the ability to round the corners of the polygon.
   * @param x - The x-coordinate of the center of the polygon.
   * @param y - The y-coordinate of the center of the polygon.
   * @param radius - The radius of the circumscribed circle of the polygon.
   * @param sides - The number of sides of the polygon. Must be 3 or more.
   * @param corner - The radius of the rounding of the corners.
   * @param rotation - The rotation angle of the polygon, in radians. Zero by default.
   * @returns The instance of the current object for chaining.
   */ roundPoly(x, y, radius, sides, corner, rotation) {
        this._tick++;
        this._activePath.roundPoly(x, y, radius, sides, corner, rotation);
        return this;
    }
    /**
   * Draws a shape with rounded corners. This function supports custom radius for each corner of the shape.
   * Optionally, corners can be rounded using a quadratic curve instead of an arc, providing a different aesthetic.
   * @param points - An array of `RoundedPoint` representing the corners of the shape to draw.
   * A minimum of 3 points is required.
   * @param radius - The default radius for the corners.
   * This radius is applied to all corners unless overridden in `points`.
   * @param useQuadratic - If set to true, rounded corners are drawn using a quadraticCurve
   *  method instead of an arc method. Defaults to false.
   * @param smoothness - Specifies the smoothness of the curve when `useQuadratic` is true.
   * Higher values make the curve smoother.
   * @returns The instance of the current object for chaining.
   */ roundShape(points, radius, useQuadratic, smoothness) {
        this._tick++;
        this._activePath.roundShape(points, radius, useQuadratic, smoothness);
        return this;
    }
    /**
   * Draw Rectangle with fillet corners. This is much like rounded rectangle
   * however it support negative numbers as well for the corner radius.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param fillet - accept negative or positive values
   */ filletRect(x, y, width, height, fillet) {
        this._tick++;
        this._activePath.filletRect(x, y, width, height, fillet);
        return this;
    }
    /**
   * Draw Rectangle with chamfer corners. These are angled corners.
   * @param x - Upper left corner of rect
   * @param y - Upper right corner of rect
   * @param width - Width of rect
   * @param height - Height of rect
   * @param chamfer - non-zero real number, size of corner cutout
   * @param transform
   */ chamferRect(x, y, width, height, chamfer, transform) {
        this._tick++;
        this._activePath.chamferRect(x, y, width, height, chamfer, transform);
        return this;
    }
    /**
   * Draws a star shape centered at a specified location. This method allows for the creation
   *  of stars with a variable number of points, outer radius, optional inner radius, and rotation.
   * The star is drawn as a closed polygon with alternating outer and inner vertices to create the star's points.
   * An optional transformation can be applied to scale, rotate, or translate the star as needed.
   * @param x - The x-coordinate of the center of the star.
   * @param y - The y-coordinate of the center of the star.
   * @param points - The number of points of the star.
   * @param radius - The outer radius of the star (distance from the center to the outer points).
   * @param innerRadius - Optional. The inner radius of the star
   * (distance from the center to the inner points between the outer points).
   * If not provided, defaults to half of the `radius`.
   * @param rotation - Optional. The rotation of the star in radians, where 0 is aligned with the y-axis.
   * Defaults to 0, meaning one point is directly upward.
   * @returns The instance of the current object for chaining further drawing commands.
   */ star(x, y, points, radius) {
        let innerRadius = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 0, rotation = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : 0;
        this._tick++;
        this._activePath.star(x, y, points, radius, innerRadius, rotation, this._transform.clone());
        return this;
    }
    /**
   * Parses and renders an SVG string into the graphics context. This allows for complex shapes and paths
   * defined in SVG format to be drawn within the graphics context.
   * @param svg - The SVG string to be parsed and rendered.
   */ svg(svg) {
        this._tick++;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$svg$2f$SVGParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SVGParser"])(svg, this);
        return this;
    }
    /**
   * Restores the most recently saved graphics state by popping the top of the graphics state stack.
   * This includes transformations, fill styles, and stroke styles.
   */ restore() {
        const state = this._stateStack.pop();
        if (state) {
            this._transform = state.transform;
            this._fillStyle = state.fillStyle;
            this._strokeStyle = state.strokeStyle;
        }
        return this;
    }
    /** Saves the current graphics state, including transformations, fill styles, and stroke styles, onto a stack. */ save() {
        this._stateStack.push({
            transform: this._transform.clone(),
            fillStyle: {
                ...this._fillStyle
            },
            strokeStyle: {
                ...this._strokeStyle
            }
        });
        return this;
    }
    /**
   * Returns the current transformation matrix of the graphics context.
   * @returns The current transformation matrix.
   */ getTransform() {
        return this._transform;
    }
    /**
   * Resets the current transformation matrix to the identity matrix, effectively removing any transformations (rotation, scaling, translation) previously applied.
   * @returns The instance of the current GraphicsContext for method chaining.
   */ resetTransform() {
        this._transform.identity();
        return this;
    }
    /**
   * Applies a rotation transformation to the graphics context around the current origin.
   * @param angle - The angle of rotation in radians.
   * @returns The instance of the current GraphicsContext for method chaining.
   */ rotate(angle) {
        this._transform.rotate(angle);
        return this;
    }
    /**
   * Applies a scaling transformation to the graphics context, scaling drawings by x horizontally and by y vertically.
   * @param x - The scale factor in the horizontal direction.
   * @param y - (Optional) The scale factor in the vertical direction. If not specified, the x value is used for both directions.
   * @returns The instance of the current GraphicsContext for method chaining.
   */ scale(x) {
        let y = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : x;
        this._transform.scale(x, y);
        return this;
    }
    setTransform(a, b, c, d, dx, dy) {
        if (a instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]) {
            this._transform.set(a.a, a.b, a.c, a.d, a.tx, a.ty);
            return this;
        }
        this._transform.set(a, b, c, d, dx, dy);
        return this;
    }
    transform(a, b, c, d, dx, dy) {
        if (a instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]) {
            this._transform.append(a);
            return this;
        }
        tempMatrix.set(a, b, c, d, dx, dy);
        this._transform.append(tempMatrix);
        return this;
    }
    /**
   * Applies a translation transformation to the graphics context, moving the origin by the specified amounts.
   * @param x - The amount to translate in the horizontal direction.
   * @param y - (Optional) The amount to translate in the vertical direction. If not specified, the x value is used for both directions.
   * @returns The instance of the current GraphicsContext for method chaining.
   */ translate(x) {
        let y = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : x;
        this._transform.translate(x, y);
        return this;
    }
    /**
   * Clears all drawing commands from the graphics context, effectively resetting it. This includes clearing the path,
   * and optionally resetting transformations to the identity matrix.
   * @returns The instance of the current GraphicsContext for method chaining.
   */ clear() {
        this._activePath.clear();
        this.instructions.length = 0;
        this.resetTransform();
        this.onUpdate();
        return this;
    }
    onUpdate() {
        if (this.dirty) return;
        this.emit("update", this, 16);
        this.dirty = true;
        this._boundsDirty = true;
    }
    /** The bounds of the graphic shape. */ get bounds() {
        if (!this._boundsDirty) return this._bounds;
        this._boundsDirty = false;
        const bounds = this._bounds;
        bounds.clear();
        for(let i = 0; i < this.instructions.length; i++){
            const instruction = this.instructions[i];
            const action = instruction.action;
            if (action === "fill") {
                const data = instruction.data;
                bounds.addBounds(data.path.bounds);
            } else if (action === "texture") {
                const data = instruction.data;
                bounds.addFrame(data.dx, data.dy, data.dx + data.dw, data.dy + data.dh, data.transform);
            }
            if (action === "stroke") {
                const data = instruction.data;
                const alignment = data.style.alignment;
                const outerPadding = data.style.width * (1 - alignment);
                const _bounds = data.path.bounds;
                bounds.addFrame(_bounds.minX - outerPadding, _bounds.minY - outerPadding, _bounds.maxX + outerPadding, _bounds.maxY + outerPadding);
            }
        }
        return bounds;
    }
    /**
   * Check to see if a point is contained within this geometry.
   * @param point - Point to check if it's contained.
   * @returns {boolean} `true` if the point is contained within geometry.
   */ containsPoint(point) {
        if (!this.bounds.containsPoint(point.x, point.y)) return false;
        const instructions = this.instructions;
        let hasHit = false;
        for(let k = 0; k < instructions.length; k++){
            const instruction = instructions[k];
            const data = instruction.data;
            const path = data.path;
            if (!instruction.action || !path) continue;
            const style = data.style;
            const shapes = path.shapePath.shapePrimitives;
            for(let i = 0; i < shapes.length; i++){
                const shape = shapes[i].shape;
                if (!style || !shape) continue;
                const transform = shapes[i].transform;
                const transformedPoint = transform ? transform.applyInverse(point, tmpPoint) : point;
                if (instruction.action === "fill") {
                    hasHit = shape.contains(transformedPoint.x, transformedPoint.y);
                } else {
                    const strokeStyle = style;
                    hasHit = shape.strokeContains(transformedPoint.x, transformedPoint.y, strokeStyle.width, strokeStyle.alignment);
                }
                const holes = data.hole;
                if (holes) {
                    var _holes_shapePath;
                    const holeShapes = (_holes_shapePath = holes.shapePath) === null || _holes_shapePath === void 0 ? void 0 : _holes_shapePath.shapePrimitives;
                    if (holeShapes) {
                        for(let j = 0; j < holeShapes.length; j++){
                            if (holeShapes[j].shape.contains(transformedPoint.x, transformedPoint.y)) {
                                hasHit = false;
                            }
                        }
                    }
                }
                if (hasHit) {
                    return true;
                }
            }
        }
        return hasHit;
    }
    /**
   * Destroys the GraphicsData object.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @example
   * context.destroy();
   * context.destroy(true);
   * context.destroy({ texture: true, textureSource: true });
   */ destroy() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        this._stateStack.length = 0;
        this._transform = null;
        this.emit("destroy", this);
        this.removeAllListeners();
        const destroyTexture = typeof options === "boolean" ? options : options === null || options === void 0 ? void 0 : options.texture;
        if (destroyTexture) {
            const destroyTextureSource = typeof options === "boolean" ? options : options === null || options === void 0 ? void 0 : options.textureSource;
            if (this._fillStyle.texture) {
                this._fillStyle.fill && "uid" in this._fillStyle.fill ? this._fillStyle.fill.destroy() : this._fillStyle.texture.destroy(destroyTextureSource);
            }
            if (this._strokeStyle.texture) {
                this._strokeStyle.fill && "uid" in this._strokeStyle.fill ? this._strokeStyle.fill.destroy() : this._strokeStyle.texture.destroy(destroyTextureSource);
            }
        }
        this._fillStyle = null;
        this._strokeStyle = null;
        this.instructions = null;
        this._activePath = null;
        this._bounds = null;
        this._stateStack = null;
        this.customShader = null;
        this._transform = null;
    }
    constructor(){
        super(...arguments);
        /**
     * unique id for this graphics context
     * @internal
     */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("graphicsContext");
        /** @internal */ this.dirty = true;
        /** The batch mode for this graphics context. It can be 'auto', 'batch', or 'no-batch'. */ this.batchMode = "auto";
        /** @internal */ this.instructions = [];
        this._activePath = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$path$2f$GraphicsPath$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsPath"]();
        this._transform = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"]();
        this._fillStyle = {
            ..._GraphicsContext.defaultFillStyle
        };
        this._strokeStyle = {
            ..._GraphicsContext.defaultStrokeStyle
        };
        this._stateStack = [];
        this._tick = 0;
        this._bounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Bounds"]();
        this._boundsDirty = true;
    }
};
/** The default fill style to use when none is provided. */ _GraphicsContext.defaultFillStyle = {
    /** The color to use for the fill. */ color: 16777215,
    /** The alpha value to use for the fill. */ alpha: 1,
    /** The texture to use for the fill. */ texture: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].WHITE,
    /** The matrix to apply. */ matrix: null,
    /** The fill pattern to use. */ fill: null,
    /** Whether coordinates are 'global' or 'local' */ textureSpace: "local"
};
/** The default stroke style to use when none is provided. */ _GraphicsContext.defaultStrokeStyle = {
    /** The width of the stroke. */ width: 1,
    /** The color to use for the stroke. */ color: 16777215,
    /** The alpha value to use for the stroke. */ alpha: 1,
    /** The alignment of the stroke. */ alignment: 0.5,
    /** The miter limit to use. */ miterLimit: 10,
    /** The line cap style to use. */ cap: "butt",
    /** The line join style to use. */ join: "miter",
    /** The texture to use for the fill. */ texture: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].WHITE,
    /** The matrix to apply. */ matrix: null,
    /** The fill pattern to use. */ fill: null,
    /** Whether coordinates are 'global' or 'local' */ textureSpace: "local",
    /** If the stroke is a pixel line. */ pixelLine: false
};
let GraphicsContext = _GraphicsContext;
;
 //# sourceMappingURL=GraphicsContext.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/TextStyle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TextStyle",
    ()=>TextStyle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/fill/FillGradient.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillPattern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/fill/FillPattern.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/GraphicsContext.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/utils/convertFillInputToFillStyle.mjs [app-client] (ecmascript)");
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
const _TextStyle = class _TextStyle extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    /**
   * Alignment for multiline text, does not affect single line text.
   * @type {'left'|'center'|'right'|'justify'}
   */ get align() {
        return this._align;
    }
    set align(value) {
        this._align = value;
        this.update();
    }
    /** Indicates if lines can be wrapped within words, it needs wordWrap to be set to true. */ get breakWords() {
        return this._breakWords;
    }
    set breakWords(value) {
        this._breakWords = value;
        this.update();
    }
    /** Set a drop shadow for the text. */ get dropShadow() {
        return this._dropShadow;
    }
    set dropShadow(value) {
        if (value !== null && typeof value === "object") {
            this._dropShadow = this._createProxy({
                ..._TextStyle.defaultDropShadow,
                ...value
            });
        } else {
            this._dropShadow = value ? this._createProxy({
                ..._TextStyle.defaultDropShadow
            }) : null;
        }
        this.update();
    }
    /** The font family, can be a single font name, or a list of names where the first is the preferred font. */ get fontFamily() {
        return this._fontFamily;
    }
    set fontFamily(value) {
        this._fontFamily = value;
        this.update();
    }
    /** The font size (as a number it converts to px, but as a string, equivalents are '26px','20pt','160%' or '1.6em') */ get fontSize() {
        return this._fontSize;
    }
    set fontSize(value) {
        if (typeof value === "string") {
            this._fontSize = parseInt(value, 10);
        } else {
            this._fontSize = value;
        }
        this.update();
    }
    /**
   * The font style.
   * @type {'normal'|'italic'|'oblique'}
   */ get fontStyle() {
        return this._fontStyle;
    }
    set fontStyle(value) {
        this._fontStyle = value.toLowerCase();
        this.update();
    }
    /**
   * The font variant.
   * @type {'normal'|'small-caps'}
   */ get fontVariant() {
        return this._fontVariant;
    }
    set fontVariant(value) {
        this._fontVariant = value;
        this.update();
    }
    /**
   * The font weight.
   * @type {'normal'|'bold'|'bolder'|'lighter'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900'}
   */ get fontWeight() {
        return this._fontWeight;
    }
    set fontWeight(value) {
        this._fontWeight = value;
        this.update();
    }
    /** The space between lines. */ get leading() {
        return this._leading;
    }
    set leading(value) {
        this._leading = value;
        this.update();
    }
    /** The amount of spacing between letters, default is 0. */ get letterSpacing() {
        return this._letterSpacing;
    }
    set letterSpacing(value) {
        this._letterSpacing = value;
        this.update();
    }
    /** The line height, a number that represents the vertical space that a letter uses. */ get lineHeight() {
        return this._lineHeight;
    }
    set lineHeight(value) {
        this._lineHeight = value;
        this.update();
    }
    /**
   * Occasionally some fonts are cropped. Adding some padding will prevent this from happening
   * by adding padding to all sides of the text.
   * > [!NOTE] This will NOT affect the positioning or bounds of the text.
   */ get padding() {
        return this._padding;
    }
    set padding(value) {
        this._padding = value;
        this.update();
    }
    /**
   * An optional filter or array of filters to apply to the text, allowing for advanced visual effects.
   * These filters will be applied to the text as it is created, resulting in faster rendering for static text
   * compared to applying the filter directly to the text object (which would be applied at run time).
   * @default null
   */ get filters() {
        return this._filters;
    }
    set filters(value) {
        this._filters = Object.freeze(value);
        this.update();
    }
    /**
   * Trim transparent borders from the text texture.
   * > [!IMPORTANT] PERFORMANCE WARNING:
   * > This is a costly operation as it requires scanning pixel alpha values.
   * > Avoid using `trim: true` for dynamic text, as it could significantly impact performance.
   */ get trim() {
        return this._trim;
    }
    set trim(value) {
        this._trim = value;
        this.update();
    }
    /**
   * The baseline of the text that is rendered.
   * @type {'alphabetic'|'top'|'hanging'|'middle'|'ideographic'|'bottom'}
   */ get textBaseline() {
        return this._textBaseline;
    }
    set textBaseline(value) {
        this._textBaseline = value;
        this.update();
    }
    /**
   * How newlines and spaces should be handled.
   * Default is 'pre' (preserve, preserve).
   *
   *  value       | New lines     |   Spaces
   *  ---         | ---           |   ---
   * 'normal'     | Collapse      |   Collapse
   * 'pre'        | Preserve      |   Preserve
   * 'pre-line'   | Preserve      |   Collapse
   * @type {'normal'|'pre'|'pre-line'}
   */ get whiteSpace() {
        return this._whiteSpace;
    }
    set whiteSpace(value) {
        this._whiteSpace = value;
        this.update();
    }
    /** Indicates if word wrap should be used. */ get wordWrap() {
        return this._wordWrap;
    }
    set wordWrap(value) {
        this._wordWrap = value;
        this.update();
    }
    /** The width at which text will wrap, it needs wordWrap to be set to true. */ get wordWrapWidth() {
        return this._wordWrapWidth;
    }
    set wordWrapWidth(value) {
        this._wordWrapWidth = value;
        this.update();
    }
    /**
   * The fill style that will be used to color the text.
   * This can be:
   * - A color string like 'red', '#00FF00', or 'rgba(255,0,0,0.5)'
   * - A hex number like 0xff0000 for red
   * - A FillStyle object with properties like { color: 0xff0000, alpha: 0.5 }
   * - A FillGradient for gradient fills
   * - A FillPattern for pattern/texture fills
   *
   * When using a FillGradient, vertical gradients (angle of 90 degrees) are applied per line of text,
   * while gradients at any other angle are spread across the entire text body as a whole.
   * @example
   * // Vertical gradient applied per line
   * const verticalGradient = new FillGradient(0, 0, 0, 1)
   *     .addColorStop(0, 0xff0000)
   *     .addColorStop(1, 0x0000ff);
   *
   * const text = new Text({
   *     text: 'Line 1\nLine 2',
   *     style: { fill: verticalGradient }
   * });
   *
   * To manage the gradient in a global scope, set the textureSpace property of the FillGradient to 'global'.
   * @type {string|number|FillStyle|FillGradient|FillPattern}
   */ get fill() {
        return this._originalFill;
    }
    set fill(value) {
        if (value === this._originalFill) return;
        this._originalFill = value;
        if (this._isFillStyle(value)) {
            this._originalFill = this._createProxy({
                ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsContext"].defaultFillStyle,
                ...value
            }, ()=>{
                this._fill = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toFillStyle"])({
                    ...this._originalFill
                }, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsContext"].defaultFillStyle);
            });
        }
        this._fill = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toFillStyle"])(value === 0 ? "black" : value, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsContext"].defaultFillStyle);
        this.update();
    }
    /** A fillstyle that will be used on the text stroke, e.g., 'blue', '#FCFF00'. */ get stroke() {
        return this._originalStroke;
    }
    set stroke(value) {
        if (value === this._originalStroke) return;
        this._originalStroke = value;
        if (this._isFillStyle(value)) {
            this._originalStroke = this._createProxy({
                ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsContext"].defaultStrokeStyle,
                ...value
            }, ()=>{
                this._stroke = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toStrokeStyle"])({
                    ...this._originalStroke
                }, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsContext"].defaultStrokeStyle);
            });
        }
        this._stroke = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$utils$2f$convertFillInputToFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toStrokeStyle"])(value, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$GraphicsContext$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GraphicsContext"].defaultStrokeStyle);
        this.update();
    }
    update() {
        this._tick++;
        this.emit("update", this);
    }
    /** Resets all properties to the default values */ reset() {
        const defaultStyle = _TextStyle.defaultTextStyle;
        for(const key in defaultStyle){
            this[key] = defaultStyle[key];
        }
    }
    /**
   * Returns a unique key for this instance.
   * This key is used for caching.
   * @returns {string} Unique key for the instance
   */ get styleKey() {
        return "".concat(this.uid, "-").concat(this._tick);
    }
    /**
   * Creates a new TextStyle object with the same values as this one.
   * @returns New cloned TextStyle object
   */ clone() {
        return new _TextStyle({
            align: this.align,
            breakWords: this.breakWords,
            dropShadow: this._dropShadow ? {
                ...this._dropShadow
            } : null,
            fill: this._fill,
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            fontStyle: this.fontStyle,
            fontVariant: this.fontVariant,
            fontWeight: this.fontWeight,
            leading: this.leading,
            letterSpacing: this.letterSpacing,
            lineHeight: this.lineHeight,
            padding: this.padding,
            stroke: this._stroke,
            textBaseline: this.textBaseline,
            whiteSpace: this.whiteSpace,
            wordWrap: this.wordWrap,
            wordWrapWidth: this.wordWrapWidth,
            filters: this._filters ? [
                ...this._filters
            ] : void 0
        });
    }
    /**
   * Returns the final padding for the text style, taking into account any filters applied.
   * Used internally for correct measurements
   * @internal
   * @returns {number} The final padding for the text style.
   */ _getFinalPadding() {
        let filterPadding = 0;
        if (this._filters) {
            for(let i = 0; i < this._filters.length; i++){
                filterPadding += this._filters[i].padding;
            }
        }
        return Math.max(this._padding, filterPadding);
    }
    /**
   * Destroys this text style.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @example
   * // Destroy the text style and its textures
   * textStyle.destroy({ texture: true, textureSource: true });
   * textStyle.destroy(true);
   */ destroy() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        this.removeAllListeners();
        const destroyTexture = typeof options === "boolean" ? options : options === null || options === void 0 ? void 0 : options.texture;
        if (destroyTexture) {
            var _this__fill, _this__originalFill, _this__stroke, _this__originalStroke;
            const destroyTextureSource = typeof options === "boolean" ? options : options === null || options === void 0 ? void 0 : options.textureSource;
            if ((_this__fill = this._fill) === null || _this__fill === void 0 ? void 0 : _this__fill.texture) {
                this._fill.texture.destroy(destroyTextureSource);
            }
            if ((_this__originalFill = this._originalFill) === null || _this__originalFill === void 0 ? void 0 : _this__originalFill.texture) {
                this._originalFill.texture.destroy(destroyTextureSource);
            }
            if ((_this__stroke = this._stroke) === null || _this__stroke === void 0 ? void 0 : _this__stroke.texture) {
                this._stroke.texture.destroy(destroyTextureSource);
            }
            if ((_this__originalStroke = this._originalStroke) === null || _this__originalStroke === void 0 ? void 0 : _this__originalStroke.texture) {
                this._originalStroke.texture.destroy(destroyTextureSource);
            }
        }
        this._fill = null;
        this._stroke = null;
        this.dropShadow = null;
        this._originalStroke = null;
        this._originalFill = null;
    }
    _createProxy(value, cb) {
        return new Proxy(value, {
            set: (target, property, newValue)=>{
                target[property] = newValue;
                cb === null || cb === void 0 ? void 0 : cb(property, newValue);
                this.update();
                return true;
            }
        });
    }
    _isFillStyle(value) {
        return (value !== null && value !== void 0 ? value : null) !== null && !(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].isColorLike(value) || value instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillGradient"] || value instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillPattern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillPattern"]);
    }
    constructor(style = {}){
        super();
        /**
     * Unique identifier for the TextStyle class.
     * This is used to track instances and ensure uniqueness.
     * @internal
     */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uid"])("textStyle");
        /**
     * Internal tick counter used to track updates and changes.
     * This is incremented whenever the style is modified, allowing for efficient change detection.
     * @internal
     */ this._tick = 0;
        convertV7Tov8Style(style);
        const fullStyle = {
            ..._TextStyle.defaultTextStyle,
            ...style
        };
        for(const key in fullStyle){
            const thisKey = key;
            this[thisKey] = fullStyle[key];
        }
        this.update();
        this._tick = 0;
    }
};
/**
 * Default drop shadow settings used when enabling drop shadows on text.
 * These values are used as the base configuration when drop shadows are enabled without specific settings.
 * @example
 * ```ts
 * // Customize default settings globally
 * TextStyle.defaultDropShadow.alpha = 0.5;    // 50% opacity for all shadows
 * TextStyle.defaultDropShadow.blur = 2;       // 2px blur for all shadows
 * TextStyle.defaultDropShadow.color = 'blue'; // Blue shadows by default
 * ```
 */ _TextStyle.defaultDropShadow = {
    alpha: 1,
    angle: Math.PI / 6,
    blur: 0,
    color: "black",
    distance: 5
};
/**
 * Default text style settings used when creating new text objects.
 * These values serve as the base configuration and can be customized globally.
 * @example
 * ```ts
 * // Customize default text style globally
 * TextStyle.defaultTextStyle.fontSize = 16;
 * TextStyle.defaultTextStyle.fill = 0x333333;
 * TextStyle.defaultTextStyle.fontFamily = ['Arial', 'Helvetica', 'sans-serif'];
 * ```
 */ _TextStyle.defaultTextStyle = {
    align: "left",
    breakWords: false,
    dropShadow: null,
    fill: "black",
    fontFamily: "Arial",
    fontSize: 26,
    fontStyle: "normal",
    fontVariant: "normal",
    fontWeight: "normal",
    leading: 0,
    letterSpacing: 0,
    lineHeight: 0,
    padding: 0,
    stroke: null,
    textBaseline: "alphabetic",
    trim: false,
    whiteSpace: "pre",
    wordWrap: false,
    wordWrapWidth: 100
};
let TextStyle = _TextStyle;
function convertV7Tov8Style(style) {
    const oldStyle = style;
    if (typeof oldStyle.dropShadow === "boolean" && oldStyle.dropShadow) {
        const defaults = TextStyle.defaultDropShadow;
        var _oldStyle_dropShadowAlpha, _oldStyle_dropShadowAngle, _oldStyle_dropShadowBlur, _oldStyle_dropShadowColor, _oldStyle_dropShadowDistance;
        style.dropShadow = {
            alpha: (_oldStyle_dropShadowAlpha = oldStyle.dropShadowAlpha) !== null && _oldStyle_dropShadowAlpha !== void 0 ? _oldStyle_dropShadowAlpha : defaults.alpha,
            angle: (_oldStyle_dropShadowAngle = oldStyle.dropShadowAngle) !== null && _oldStyle_dropShadowAngle !== void 0 ? _oldStyle_dropShadowAngle : defaults.angle,
            blur: (_oldStyle_dropShadowBlur = oldStyle.dropShadowBlur) !== null && _oldStyle_dropShadowBlur !== void 0 ? _oldStyle_dropShadowBlur : defaults.blur,
            color: (_oldStyle_dropShadowColor = oldStyle.dropShadowColor) !== null && _oldStyle_dropShadowColor !== void 0 ? _oldStyle_dropShadowColor : defaults.color,
            distance: (_oldStyle_dropShadowDistance = oldStyle.dropShadowDistance) !== null && _oldStyle_dropShadowDistance !== void 0 ? _oldStyle_dropShadowDistance : defaults.distance
        };
    }
    if (oldStyle.strokeThickness !== void 0) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "strokeThickness is now a part of stroke");
        const color = oldStyle.stroke;
        let obj = {};
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].isColorLike(color)) {
            obj.color = color;
        } else if (color instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillGradient"] || color instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillPattern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillPattern"]) {
            obj.fill = color;
        } else if (Object.hasOwnProperty.call(color, "color") || Object.hasOwnProperty.call(color, "fill")) {
            obj = color;
        } else {
            throw new Error("Invalid stroke value.");
        }
        style.stroke = {
            ...obj,
            width: oldStyle.strokeThickness
        };
    }
    if (Array.isArray(oldStyle.fillGradientStops)) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "gradient fill is now a fill pattern: `new FillGradient(...)`");
        if (!Array.isArray(oldStyle.fill) || oldStyle.fill.length === 0) {
            throw new Error("Invalid fill value. Expected an array of colors for gradient fill.");
        }
        if (oldStyle.fill.length !== oldStyle.fillGradientStops.length) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])("The number of fill colors must match the number of fill gradient stops.");
        }
        const gradientFill = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillGradient"]({
            start: {
                x: 0,
                y: 0
            },
            end: {
                x: 0,
                y: 1
            },
            textureSpace: "local"
        });
        const fillGradientStops = oldStyle.fillGradientStops.slice();
        const fills = oldStyle.fill.map((color)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(color).toNumber());
        fillGradientStops.forEach((stop, index)=>{
            gradientFill.addColorStop(stop, fills[index]);
        });
        style.fill = {
            fill: gradientFill
        };
    }
}
;
 //# sourceMappingURL=TextStyle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/utils/getCanvasFillStyle.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCanvasFillStyle",
    ()=>getCanvasFillStyle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/fill/FillGradient.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillPattern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/shared/fill/FillPattern.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
"use strict";
const PRECISION = 1e5;
function getCanvasFillStyle(fillStyle, context, textMetrics) {
    let padding = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
    if (fillStyle.texture === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].WHITE && !fillStyle.fill) {
        var _fillStyle_alpha;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(fillStyle.color).setAlpha((_fillStyle_alpha = fillStyle.alpha) !== null && _fillStyle_alpha !== void 0 ? _fillStyle_alpha : 1).toHexa();
    } else if (!fillStyle.fill) {
        const pattern = context.createPattern(fillStyle.texture.source.resource, "repeat");
        const tempMatrix = fillStyle.matrix.copyTo(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"].shared);
        tempMatrix.scale(fillStyle.texture.frame.width, fillStyle.texture.frame.height);
        pattern.setTransform(tempMatrix);
        return pattern;
    } else if (fillStyle.fill instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillPattern$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillPattern"]) {
        const fillPattern = fillStyle.fill;
        const pattern = context.createPattern(fillPattern.texture.source.resource, "repeat");
        const tempMatrix = fillPattern.transform.copyTo(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix"].shared);
        tempMatrix.scale(fillPattern.texture.frame.width, fillPattern.texture.frame.height);
        pattern.setTransform(tempMatrix);
        return pattern;
    } else if (fillStyle.fill instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$shared$2f$fill$2f$FillGradient$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FillGradient"]) {
        const fillGradient = fillStyle.fill;
        const isLinear = fillGradient.type === "linear";
        const isLocal = fillGradient.textureSpace === "local";
        let width = 1;
        let height = 1;
        if (isLocal && textMetrics) {
            width = textMetrics.width + padding;
            height = textMetrics.height + padding;
        }
        let gradient;
        let isNearlyVertical = false;
        if (isLinear) {
            const { start, end } = fillGradient;
            gradient = context.createLinearGradient(start.x * width, start.y * height, end.x * width, end.y * height);
            isNearlyVertical = Math.abs(end.x - start.x) < Math.abs((end.y - start.y) * 0.1);
        } else {
            const { center, innerRadius, outerCenter, outerRadius } = fillGradient;
            gradient = context.createRadialGradient(center.x * width, center.y * height, innerRadius * width, outerCenter.x * width, outerCenter.y * height, outerRadius * width);
        }
        if (isNearlyVertical && isLocal && textMetrics) {
            const ratio = textMetrics.lineHeight / height;
            for(let i = 0; i < textMetrics.lines.length; i++){
                const start = (i * textMetrics.lineHeight + padding / 2) / height;
                fillGradient.colorStops.forEach((stop)=>{
                    const globalStop = start + stop.offset * ratio;
                    gradient.addColorStop(// fix to 5 decimal places to avoid floating point precision issues
                    Math.floor(globalStop * PRECISION) / PRECISION, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(stop.color).toHex());
                });
            }
        } else {
            fillGradient.colorStops.forEach((stop)=>{
                gradient.addColorStop(stop.offset, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(stop.color).toHex());
            });
        }
        return gradient;
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])("FillStyle not recognised", fillStyle);
    return "red";
}
;
 //# sourceMappingURL=getCanvasFillStyle.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/DynamicBitmapFont.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DynamicBitmapFont",
    ()=>DynamicBitmapFont
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/CanvasPool.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$ImageSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/ImageSource.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureStyle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextMetrics.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$fontStringFromTextStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/utils/fontStringFromTextStyle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$getCanvasFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/utils/getCanvasFillStyle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$TextStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/TextStyle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$AbstractBitmapFont$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/AbstractBitmapFont.mjs [app-client] (ecmascript)");
;
;
;
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
const _DynamicBitmapFont = class _DynamicBitmapFont extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$AbstractBitmapFont$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AbstractBitmapFont"] {
    ensureCharacters(chars) {
        const charList = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CanvasTextMetrics"].graphemeSegmenter(chars).filter((char)=>!this._currentChars.includes(char)).filter((char, index, self)=>self.indexOf(char) === index);
        if (!charList.length) return;
        this._currentChars = [
            ...this._currentChars,
            ...charList
        ];
        let pageData;
        if (this._currentPageIndex === -1) {
            pageData = this._nextPage();
        } else {
            pageData = this.pages[this._currentPageIndex];
        }
        let { canvas, context } = pageData.canvasAndContext;
        let textureSource = pageData.texture.source;
        const style = this._style;
        let currentX = this._currentX;
        let currentY = this._currentY;
        let currentMaxCharHeight = this._currentMaxCharHeight;
        const fontScale = this.baseRenderedFontSize / this.baseMeasurementFontSize;
        const padding = this._padding * fontScale;
        let skipTexture = false;
        const maxTextureWidth = canvas.width / this.resolution;
        const maxTextureHeight = canvas.height / this.resolution;
        for(let i = 0; i < charList.length; i++){
            var _style_dropShadow, _style__stroke;
            const char = charList[i];
            const metrics = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CanvasTextMetrics"].measureText(char, style, canvas, false);
            metrics.lineHeight = metrics.height;
            const width = metrics.width * fontScale;
            const textureGlyphWidth = Math.ceil((style.fontStyle === "italic" ? 2 : 1) * width);
            const height = metrics.height * fontScale;
            const paddedWidth = textureGlyphWidth + padding * 2;
            const paddedHeight = height + padding * 2;
            skipTexture = false;
            if (char !== "\n" && char !== "\r" && char !== "	" && char !== " ") {
                skipTexture = true;
                currentMaxCharHeight = Math.ceil(Math.max(paddedHeight, currentMaxCharHeight));
            }
            if (currentX + paddedWidth > maxTextureWidth) {
                currentY += currentMaxCharHeight;
                currentMaxCharHeight = paddedHeight;
                currentX = 0;
                if (currentY + currentMaxCharHeight > maxTextureHeight) {
                    textureSource.update();
                    const pageData2 = this._nextPage();
                    canvas = pageData2.canvasAndContext.canvas;
                    context = pageData2.canvasAndContext.context;
                    textureSource = pageData2.texture.source;
                    currentX = 0;
                    currentY = 0;
                    currentMaxCharHeight = 0;
                }
            }
            var _style_dropShadow_distance, _style__stroke_width;
            const xAdvance = width / fontScale - ((_style_dropShadow_distance = (_style_dropShadow = style.dropShadow) === null || _style_dropShadow === void 0 ? void 0 : _style_dropShadow.distance) !== null && _style_dropShadow_distance !== void 0 ? _style_dropShadow_distance : 0) - ((_style__stroke_width = (_style__stroke = style._stroke) === null || _style__stroke === void 0 ? void 0 : _style__stroke.width) !== null && _style__stroke_width !== void 0 ? _style__stroke_width : 0);
            this.chars[char] = {
                id: char.codePointAt(0),
                xOffset: -this._padding,
                yOffset: -this._padding,
                xAdvance,
                kerning: {}
            };
            if (skipTexture) {
                this._drawGlyph(context, metrics, currentX + padding, currentY + padding, fontScale, style);
                const px = textureSource.width * fontScale;
                const py = textureSource.height * fontScale;
                const frame = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"](currentX / px * textureSource.width, currentY / py * textureSource.height, paddedWidth / px * textureSource.width, paddedHeight / py * textureSource.height);
                this.chars[char].texture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]({
                    source: textureSource,
                    frame
                });
                currentX += Math.ceil(paddedWidth);
            }
        }
        textureSource.update();
        this._currentX = currentX;
        this._currentY = currentY;
        this._currentMaxCharHeight = currentMaxCharHeight;
        this._skipKerning && this._applyKerning(charList, context);
    }
    /**
   * @deprecated since 8.0.0
   * The map of base page textures (i.e., sheets of glyphs).
   */ get pageTextures() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead.");
        return this.pages;
    }
    _applyKerning(newChars, context) {
        const measureCache = this._measureCache;
        for(let i = 0; i < newChars.length; i++){
            const first = newChars[i];
            for(let j = 0; j < this._currentChars.length; j++){
                const second = this._currentChars[j];
                let c1 = measureCache[first];
                if (!c1) c1 = measureCache[first] = context.measureText(first).width;
                let c2 = measureCache[second];
                if (!c2) c2 = measureCache[second] = context.measureText(second).width;
                let total = context.measureText(first + second).width;
                let amount = total - (c1 + c2);
                if (amount) {
                    this.chars[first].kerning[second] = amount;
                }
                total = context.measureText(first + second).width;
                amount = total - (c1 + c2);
                if (amount) {
                    this.chars[second].kerning[first] = amount;
                }
            }
        }
    }
    _nextPage() {
        this._currentPageIndex++;
        const textureResolution = this.resolution;
        const canvasAndContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CanvasPool"].getOptimalCanvasAndContext(this._textureSize, this._textureSize, textureResolution);
        this._setupContext(canvasAndContext.context, this._style, textureResolution);
        const resolution = textureResolution * (this.baseRenderedFontSize / this.baseMeasurementFontSize);
        const texture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]({
            source: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$ImageSource$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ImageSource"]({
                resource: canvasAndContext.canvas,
                resolution,
                alphaMode: "premultiply-alpha-on-upload",
                autoGenerateMipmaps: this._mipmap
            })
        });
        if (this._textureStyle) {
            texture.source.style = this._textureStyle;
        }
        const pageData = {
            canvasAndContext,
            texture
        };
        this.pages[this._currentPageIndex] = pageData;
        return pageData;
    }
    // canvas style!
    _setupContext(context, style, resolution) {
        style.fontSize = this.baseRenderedFontSize;
        context.scale(resolution, resolution);
        context.font = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$fontStringFromTextStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fontStringFromTextStyle"])(style);
        style.fontSize = this.baseMeasurementFontSize;
        context.textBaseline = style.textBaseline;
        const stroke = style._stroke;
        var _stroke_width;
        const strokeThickness = (_stroke_width = stroke === null || stroke === void 0 ? void 0 : stroke.width) !== null && _stroke_width !== void 0 ? _stroke_width : 0;
        if (stroke) {
            context.lineWidth = strokeThickness;
            context.lineJoin = stroke.join;
            context.miterLimit = stroke.miterLimit;
            context.strokeStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$getCanvasFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCanvasFillStyle"])(stroke, context);
        }
        if (style._fill) {
            context.fillStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$getCanvasFillStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCanvasFillStyle"])(style._fill, context);
        }
        if (style.dropShadow) {
            const shadowOptions = style.dropShadow;
            const rgb = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"].shared.setValue(shadowOptions.color).toArray();
            const dropShadowBlur = shadowOptions.blur * resolution;
            const dropShadowDistance = shadowOptions.distance * resolution;
            context.shadowColor = "rgba(".concat(rgb[0] * 255, ",").concat(rgb[1] * 255, ",").concat(rgb[2] * 255, ",").concat(shadowOptions.alpha, ")");
            context.shadowBlur = dropShadowBlur;
            context.shadowOffsetX = Math.cos(shadowOptions.angle) * dropShadowDistance;
            context.shadowOffsetY = Math.sin(shadowOptions.angle) * dropShadowDistance;
        } else {
            context.shadowColor = "black";
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }
    }
    _drawGlyph(context, metrics, x, y, fontScale, style) {
        const char = metrics.text;
        const fontProperties = metrics.fontProperties;
        const stroke = style._stroke;
        var _stroke_width;
        const strokeThickness = ((_stroke_width = stroke === null || stroke === void 0 ? void 0 : stroke.width) !== null && _stroke_width !== void 0 ? _stroke_width : 0) * fontScale;
        const tx = x + strokeThickness / 2;
        const ty = y - strokeThickness / 2;
        const descent = fontProperties.descent * fontScale;
        const lineHeight = metrics.lineHeight * fontScale;
        let removeShadow = false;
        if (style.stroke && strokeThickness) {
            removeShadow = true;
            context.strokeText(char, tx, ty + lineHeight - descent);
        }
        const { shadowBlur, shadowOffsetX, shadowOffsetY } = context;
        if (style._fill) {
            if (removeShadow) {
                context.shadowBlur = 0;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }
            context.fillText(char, tx, ty + lineHeight - descent);
        }
        if (removeShadow) {
            context.shadowBlur = shadowBlur;
            context.shadowOffsetX = shadowOffsetX;
            context.shadowOffsetY = shadowOffsetY;
        }
    }
    destroy() {
        super.destroy();
        for(let i = 0; i < this.pages.length; i++){
            const { canvasAndContext, texture } = this.pages[i];
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$CanvasPool$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CanvasPool"].returnCanvasAndContext(canvasAndContext);
            texture.destroy(true);
        }
        this.pages = null;
    }
    /**
   * @param options - The options for the dynamic bitmap font.
   */ constructor(options){
        super();
        /**
     * this is a resolution modifier for the font size..
     * texture resolution will also be used to scale texture according to its font size also
     */ this.resolution = 1;
        /** The pages of the font. */ this.pages = [];
        this._padding = 0;
        this._measureCache = /* @__PURE__ */ Object.create(null);
        this._currentChars = [];
        this._currentX = 0;
        this._currentY = 0;
        this._currentMaxCharHeight = 0;
        this._currentPageIndex = -1;
        this._skipKerning = false;
        const dynamicOptions = {
            ..._DynamicBitmapFont.defaultOptions,
            ...options
        };
        this._textureSize = dynamicOptions.textureSize;
        this._mipmap = dynamicOptions.mipmap;
        const style = dynamicOptions.style.clone();
        if (dynamicOptions.overrideFill) {
            style._fill.color = 16777215;
            style._fill.alpha = 1;
            style._fill.texture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"].WHITE;
            style._fill.fill = null;
        }
        this.applyFillAsTint = dynamicOptions.overrideFill;
        const requestedFontSize = style.fontSize;
        style.fontSize = this.baseMeasurementFontSize;
        const font = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$utils$2f$fontStringFromTextStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fontStringFromTextStyle"])(style);
        if (dynamicOptions.overrideSize) {
            if (style._stroke) {
                style._stroke.width *= this.baseRenderedFontSize / requestedFontSize;
            }
        } else {
            style.fontSize = this.baseRenderedFontSize = requestedFontSize;
        }
        this._style = style;
        var _dynamicOptions_skipKerning;
        this._skipKerning = (_dynamicOptions_skipKerning = dynamicOptions.skipKerning) !== null && _dynamicOptions_skipKerning !== void 0 ? _dynamicOptions_skipKerning : false;
        var _dynamicOptions_resolution;
        this.resolution = (_dynamicOptions_resolution = dynamicOptions.resolution) !== null && _dynamicOptions_resolution !== void 0 ? _dynamicOptions_resolution : 1;
        var _dynamicOptions_padding;
        this._padding = (_dynamicOptions_padding = dynamicOptions.padding) !== null && _dynamicOptions_padding !== void 0 ? _dynamicOptions_padding : 4;
        if (dynamicOptions.textureStyle) {
            this._textureStyle = dynamicOptions.textureStyle instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureStyle"] ? dynamicOptions.textureStyle : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureStyle"](dynamicOptions.textureStyle);
        }
        this.fontMetrics = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CanvasTextMetrics"].measureFont(font);
        this.lineHeight = style.lineHeight || this.fontMetrics.fontSize || style.fontSize;
    }
};
_DynamicBitmapFont.defaultOptions = {
    textureSize: 512,
    style: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$TextStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextStyle"](),
    mipmap: true
};
let DynamicBitmapFont = _DynamicBitmapFont;
;
 //# sourceMappingURL=DynamicBitmapFont.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/utils/getBitmapTextLayout.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBitmapTextLayout",
    ()=>getBitmapTextLayout
]);
"use strict";
function getBitmapTextLayout(chars, style, font, trimEnd) {
    const layoutData = {
        width: 0,
        height: 0,
        offsetY: 0,
        scale: style.fontSize / font.baseMeasurementFontSize,
        lines: [
            {
                width: 0,
                charPositions: [],
                spaceWidth: 0,
                spacesIndex: [],
                chars: []
            }
        ]
    };
    layoutData.offsetY = font.baseLineOffset;
    let currentLine = layoutData.lines[0];
    let previousChar = null;
    let firstWord = true;
    const currentWord = {
        spaceWord: false,
        width: 0,
        start: 0,
        index: 0,
        // use index to not modify the array as we use it a lot!
        positions: [],
        chars: []
    };
    const scale = font.baseMeasurementFontSize / style.fontSize;
    const adjustedLetterSpacing = style.letterSpacing * scale;
    const adjustedWordWrapWidth = style.wordWrapWidth * scale;
    const adjustedLineHeight = style.lineHeight ? style.lineHeight * scale : font.lineHeight;
    const breakWords = style.wordWrap && style.breakWords;
    const nextWord = (word)=>{
        const start = currentLine.width;
        for(let j = 0; j < currentWord.index; j++){
            const position = word.positions[j];
            currentLine.chars.push(word.chars[j]);
            currentLine.charPositions.push(position + start);
        }
        currentLine.width += word.width;
        firstWord = false;
        currentWord.width = 0;
        currentWord.index = 0;
        currentWord.chars.length = 0;
    };
    const nextLine = ()=>{
        let index = currentLine.chars.length - 1;
        if (trimEnd) {
            let lastChar = currentLine.chars[index];
            while(lastChar === " "){
                currentLine.width -= font.chars[lastChar].xAdvance;
                lastChar = currentLine.chars[--index];
            }
        }
        layoutData.width = Math.max(layoutData.width, currentLine.width);
        currentLine = {
            width: 0,
            charPositions: [],
            chars: [],
            spaceWidth: 0,
            spacesIndex: []
        };
        firstWord = true;
        layoutData.lines.push(currentLine);
        layoutData.height += adjustedLineHeight;
    };
    const checkIsOverflow = (lineWidth)=>lineWidth - adjustedLetterSpacing > adjustedWordWrapWidth;
    for(let i = 0; i < chars.length + 1; i++){
        let char;
        const isEnd = i === chars.length;
        if (!isEnd) {
            char = chars[i];
        }
        const charData = font.chars[char] || font.chars[" "];
        const isSpace = /(?:\s)/.test(char);
        const isWordBreak = isSpace || char === "\r" || char === "\n" || isEnd;
        if (isWordBreak) {
            const addWordToNextLine = !firstWord && style.wordWrap && checkIsOverflow(currentLine.width + currentWord.width);
            if (addWordToNextLine) {
                nextLine();
                nextWord(currentWord);
                if (!isEnd) {
                    currentLine.charPositions.push(0);
                }
            } else {
                currentWord.start = currentLine.width;
                nextWord(currentWord);
                if (!isEnd) {
                    currentLine.charPositions.push(0);
                }
            }
            if (char === "\r" || char === "\n") {
                nextLine();
            } else if (!isEnd) {
                const spaceWidth = charData.xAdvance + (charData.kerning[previousChar] || 0) + adjustedLetterSpacing;
                currentLine.width += spaceWidth;
                currentLine.spaceWidth = spaceWidth;
                currentLine.spacesIndex.push(currentLine.charPositions.length);
                currentLine.chars.push(char);
            }
        } else {
            const kerning = charData.kerning[previousChar] || 0;
            const nextCharWidth = charData.xAdvance + kerning + adjustedLetterSpacing;
            const addWordToNextLine = breakWords && checkIsOverflow(currentLine.width + currentWord.width + nextCharWidth);
            if (addWordToNextLine) {
                nextWord(currentWord);
                nextLine();
            }
            currentWord.positions[currentWord.index++] = currentWord.width + kerning;
            currentWord.chars.push(char);
            currentWord.width += nextCharWidth;
        }
        previousChar = char;
    }
    nextLine();
    if (style.align === "center") {
        alignCenter(layoutData);
    } else if (style.align === "right") {
        alignRight(layoutData);
    } else if (style.align === "justify") {
        alignJustify(layoutData);
    }
    return layoutData;
}
function alignCenter(measurementData) {
    for(let i = 0; i < measurementData.lines.length; i++){
        const line = measurementData.lines[i];
        const offset = measurementData.width / 2 - line.width / 2;
        for(let j = 0; j < line.charPositions.length; j++){
            line.charPositions[j] += offset;
        }
    }
}
function alignRight(measurementData) {
    for(let i = 0; i < measurementData.lines.length; i++){
        const line = measurementData.lines[i];
        const offset = measurementData.width - line.width;
        for(let j = 0; j < line.charPositions.length; j++){
            line.charPositions[j] += offset;
        }
    }
}
function alignJustify(measurementData) {
    const width = measurementData.width;
    for(let i = 0; i < measurementData.lines.length; i++){
        const line = measurementData.lines[i];
        let indy = 0;
        let spaceIndex = line.spacesIndex[indy++];
        let offset = 0;
        const totalSpaces = line.spacesIndex.length;
        const newSpaceWidth = (width - line.width) / totalSpaces;
        const spaceWidth = newSpaceWidth;
        for(let j = 0; j < line.charPositions.length; j++){
            if (j === spaceIndex) {
                spaceIndex = line.spacesIndex[indy++];
                offset += spaceWidth;
            }
            line.charPositions[j] += offset;
        }
    }
}
;
 //# sourceMappingURL=getBitmapTextLayout.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/utils/resolveCharacters.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveCharacters",
    ()=>resolveCharacters
]);
"use strict";
function resolveCharacters(chars) {
    if (chars === "") {
        return [];
    }
    if (typeof chars === "string") {
        chars = [
            chars
        ];
    }
    const result = [];
    for(let i = 0, j = chars.length; i < j; i++){
        const item = chars[i];
        if (Array.isArray(item)) {
            if (item.length !== 2) {
                throw new Error("[BitmapFont]: Invalid character range length, expecting 2 got ".concat(item.length, "."));
            }
            if (item[0].length === 0 || item[1].length === 0) {
                throw new Error("[BitmapFont]: Invalid character delimiter.");
            }
            const startCode = item[0].charCodeAt(0);
            const endCode = item[1].charCodeAt(0);
            if (endCode < startCode) {
                throw new Error("[BitmapFont]: Invalid character range.");
            }
            for(let i2 = startCode, j2 = endCode; i2 <= j2; i2++){
                result.push(String.fromCharCode(i2));
            }
        } else {
            result.push(...Array.from(item));
        }
    }
    if (result.length === 0) {
        throw new Error("[BitmapFont]: Empty set when resolving characters.");
    }
    return result;
}
;
 //# sourceMappingURL=resolveCharacters.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/BitmapFontManager.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BitmapFontManager",
    ()=>BitmapFontManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tiny$2d$lru$40$11$2e$4$2e$5$2f$node_modules$2f$tiny$2d$lru$2f$dist$2f$tiny$2d$lru$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/tiny-lru@11.4.5/node_modules/tiny-lru/dist/tiny-lru.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/cache/Cache.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextMetrics.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$TextStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text/TextStyle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$DynamicBitmapFont$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/DynamicBitmapFont.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$utils$2f$getBitmapTextLayout$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/utils/getBitmapTextLayout.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$utils$2f$resolveCharacters$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/utils/resolveCharacters.mjs [app-client] (ecmascript)");
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
let fontCount = 0;
class BitmapFontManagerClass {
    /**
   * Get a font for the specified text and style.
   * @param text - The text to get the font for
   * @param style - The style to use
   */ getFont(text, style) {
        var _dynamicFont_ensureCharacters;
        let fontFamilyKey = "".concat(style.fontFamily, "-bitmap");
        let overrideFill = true;
        if (style._fill.fill && !style._stroke) {
            fontFamilyKey += style._fill.fill.styleKey;
            overrideFill = false;
        } else if (style._stroke || style.dropShadow) {
            fontFamilyKey = "".concat(style.styleKey, "-bitmap");
            overrideFill = false;
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].has(fontFamilyKey)) {
            const styleCopy = Object.create(style);
            styleCopy.lineHeight = 0;
            const fnt = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$DynamicBitmapFont$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DynamicBitmapFont"]({
                style: styleCopy,
                overrideFill,
                overrideSize: true,
                ...this.defaultOptions
            });
            fontCount++;
            if (fontCount > 50) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warn"])("BitmapText", "You have dynamically created ".concat(fontCount, ' bitmap fonts, this can be inefficient. Try pre installing your font styles using `BitmapFont.install({name:"style1", style})`'));
            }
            fnt.once("destroy", ()=>{
                fontCount--;
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].remove(fontFamilyKey);
            });
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].set(fontFamilyKey, fnt);
        }
        const dynamicFont = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].get(fontFamilyKey);
        (_dynamicFont_ensureCharacters = dynamicFont.ensureCharacters) === null || _dynamicFont_ensureCharacters === void 0 ? void 0 : _dynamicFont_ensureCharacters.call(dynamicFont, text);
        return dynamicFont;
    }
    /**
   * Get the layout of a text for the specified style.
   * @param text - The text to get the layout for
   * @param style - The style to use
   * @param trimEnd - Whether to ignore whitespaces at the end of each line
   */ getLayout(text, style) {
        let trimEnd = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
        const bitmapFont = this.getFont(text, style);
        const id = "".concat(text, "-").concat(style.styleKey, "-").concat(trimEnd);
        if (this.measureCache.has(id)) {
            return this.measureCache.get(id);
        }
        const segments = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$canvas$2f$CanvasTextMetrics$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CanvasTextMetrics"].graphemeSegmenter(text);
        const layoutData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$utils$2f$getBitmapTextLayout$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBitmapTextLayout"])(segments, style, bitmapFont, trimEnd);
        this.measureCache.set(id, layoutData);
        return layoutData;
    }
    /**
   * Measure the text using the specified style.
   * @param text - The text to measure
   * @param style - The style to use
   * @param trimEnd - Whether to ignore whitespaces at the end of each line
   */ measureText(text, style) {
        let trimEnd = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
        return this.getLayout(text, style, trimEnd);
    }
    // eslint-disable-next-line max-len
    install() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        let options = args[0];
        if (typeof options === "string") {
            var _args_, _args_1, _args_2, _args_3;
            options = {
                name: options,
                style: args[1],
                chars: (_args_ = args[2]) === null || _args_ === void 0 ? void 0 : _args_.chars,
                resolution: (_args_1 = args[2]) === null || _args_1 === void 0 ? void 0 : _args_1.resolution,
                padding: (_args_2 = args[2]) === null || _args_2 === void 0 ? void 0 : _args_2.padding,
                skipKerning: (_args_3 = args[2]) === null || _args_3 === void 0 ? void 0 : _args_3.skipKerning
            };
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["v8_0_0"], "BitmapFontManager.install(name, style, options) is deprecated, use BitmapFontManager.install({name, style, ...options})");
        }
        const name = options === null || options === void 0 ? void 0 : options.name;
        if (!name) {
            throw new Error("[BitmapFontManager] Property `name` is required.");
        }
        options = {
            ...this.defaultOptions,
            ...options
        };
        const textStyle = options.style;
        const style = textStyle instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$TextStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextStyle"] ? textStyle : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2f$TextStyle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextStyle"](textStyle);
        var _options_dynamicFill;
        const overrideFill = (_options_dynamicFill = options.dynamicFill) !== null && _options_dynamicFill !== void 0 ? _options_dynamicFill : this._canUseTintForStyle(style);
        const font = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$DynamicBitmapFont$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DynamicBitmapFont"]({
            style,
            overrideFill,
            skipKerning: options.skipKerning,
            padding: options.padding,
            resolution: options.resolution,
            overrideSize: false,
            textureStyle: options.textureStyle
        });
        const flatChars = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$utils$2f$resolveCharacters$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveCharacters"])(options.chars);
        font.ensureCharacters(flatChars.join(""));
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].set("".concat(name, "-bitmap"), font);
        font.once("destroy", ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].remove("".concat(name, "-bitmap")));
        return font;
    }
    /**
   * Uninstalls a bitmap font from the cache.
   * @param {string} name - The name of the bitmap font to uninstall.
   */ uninstall(name) {
        const cacheKey = "".concat(name, "-bitmap");
        const font = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$cache$2f$Cache$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cache"].get(cacheKey);
        if (font) {
            font.destroy();
        }
    }
    /**
   * Determines if a style can use tinting instead of baking colors into the bitmap.
   * Tinting is more efficient as it allows reusing the same bitmap with different colors.
   * @param style - The text style to evaluate
   * @returns true if the style can use tinting, false if colors must be baked in
   * @private
   */ _canUseTintForStyle(style) {
        return !style._stroke && (!style.dropShadow || style.dropShadow.color === 0) && !style._fill.fill && style._fill.color === 16777215;
    }
    constructor(){
        /**
     * This character set includes all the letters in the alphabet (both lower- and upper- case).
     * @type {string[][]}
     * @example
     * BitmapFont.from('ExampleFont', style, { chars: BitmapFont.ALPHA })
     */ this.ALPHA = [
            [
                "a",
                "z"
            ],
            [
                "A",
                "Z"
            ],
            " "
        ];
        /**
     * This character set includes all decimal digits (from 0 to 9).
     * @type {string[][]}
     * @example
     * BitmapFont.from('ExampleFont', style, { chars: BitmapFont.NUMERIC })
     */ this.NUMERIC = [
            [
                "0",
                "9"
            ]
        ];
        /**
     * This character set is the union of `BitmapFont.ALPHA` and `BitmapFont.NUMERIC`.
     * @type {string[][]}
     */ this.ALPHANUMERIC = [
            [
                "a",
                "z"
            ],
            [
                "A",
                "Z"
            ],
            [
                "0",
                "9"
            ],
            " "
        ];
        /**
     * This character set consists of all the ASCII table.
     * @type {string[][]}
     * @see http://www.asciitable.com/
     */ this.ASCII = [
            [
                " ",
                "~"
            ]
        ];
        /** Default options for installing a new BitmapFont. */ this.defaultOptions = {
            chars: this.ALPHANUMERIC,
            resolution: 1,
            padding: 4,
            skipKerning: false,
            textureStyle: null
        };
        /** Cache for measured text layouts to avoid recalculating them multiple times. */ this.measureCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tiny$2d$lru$40$11$2e$4$2e$5$2f$node_modules$2f$tiny$2d$lru$2f$dist$2f$tiny$2d$lru$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lru"])(1e3);
    }
}
const BitmapFontManager = new BitmapFontManagerClass();
;
 //# sourceMappingURL=BitmapFontManager.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/BitmapFont.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BitmapFont",
    ()=>BitmapFont
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/groupD8.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$AbstractBitmapFont$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/AbstractBitmapFont.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$BitmapFontManager$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/BitmapFontManager.mjs [app-client] (ecmascript)");
;
;
;
;
;
"use strict";
class BitmapFont extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$AbstractBitmapFont$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AbstractBitmapFont"] {
    /** Destroys the BitmapFont object. */ destroy() {
        super.destroy();
        for(let i = 0; i < this.pages.length; i++){
            const { texture } = this.pages[i];
            texture.destroy(true);
        }
        this.pages = null;
    }
    /**
   * Generates and installs a bitmap font with the specified options.
   * The font will be cached and available for use in BitmapText objects.
   * @param options - Setup options for font generation
   * @returns Installed font instance
   * @example
   * ```ts
   * // Install a basic font
   * BitmapFont.install({
   *     name: 'Title',
   *     style: {
   *         fontFamily: 'Arial',
   *         fontSize: 32,
   *         fill: '#ffffff'
   *     }
   * });
   *
   * // Install with advanced options
   * BitmapFont.install({
   *     name: 'Custom',
   *     style: {
   *         fontFamily: 'Arial',
   *         fontSize: 24,
   *         fill: '#00ff00',
   *         stroke: { color: '#000000', width: 2 }
   *     },
   *     chars: [['a', 'z'], ['A', 'Z'], ['0', '9']],
   *     resolution: 2,
   *     padding: 4,
   *     textureStyle: {
   *         scaleMode: 'nearest'
   *     }
   * });
   * ```
   */ static install(options) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$BitmapFontManager$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BitmapFontManager"].install(options);
    }
    /**
   * Uninstalls a bitmap font from the cache.
   * This frees up memory and resources associated with the font.
   * @param name - The name of the bitmap font to uninstall
   * @example
   * ```ts
   * // Remove a font when it's no longer needed
   * BitmapFont.uninstall('MyCustomFont');
   *
   * // Clear multiple fonts
   * ['Title', 'Heading', 'Body'].forEach(BitmapFont.uninstall);
   * ```
   */ static uninstall(name) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$BitmapFontManager$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BitmapFontManager"].uninstall(name);
    }
    constructor(options, url){
        super();
        const { textures, data } = options;
        Object.keys(data.pages).forEach((key)=>{
            const pageData = data.pages[parseInt(key, 10)];
            const texture = textures[pageData.id];
            this.pages.push({
                texture
            });
        });
        Object.keys(data.chars).forEach((key)=>{
            const charData = data.chars[key];
            const { frame: textureFrame, source: textureSource, rotate: textureRotate } = textures[charData.page];
            const frame = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$groupD8$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupD8"].transformRectCoords(charData, textureFrame, textureRotate, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"]());
            const texture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Texture"]({
                frame,
                orig: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rectangle"](0, 0, charData.width, charData.height),
                source: textureSource,
                rotate: textureRotate
            });
            var _charData_kerning;
            this.chars[key] = {
                id: key.codePointAt(0),
                xOffset: charData.xOffset,
                yOffset: charData.yOffset,
                xAdvance: charData.xAdvance,
                kerning: (_charData_kerning = charData.kerning) !== null && _charData_kerning !== void 0 ? _charData_kerning : {},
                texture
            };
        });
        this.baseRenderedFontSize = data.fontSize;
        this.baseMeasurementFontSize = data.fontSize;
        this.fontMetrics = {
            ascent: 0,
            descent: 0,
            fontSize: data.fontSize
        };
        this.baseLineOffset = data.baseLineOffset;
        this.lineHeight = data.lineHeight;
        this.fontFamily = data.fontFamily;
        var _data_distanceField;
        this.distanceField = (_data_distanceField = data.distanceField) !== null && _data_distanceField !== void 0 ? _data_distanceField : {
            type: "none",
            range: 0
        };
        this.url = url;
    }
}
;
 //# sourceMappingURL=BitmapFont.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/asset/bitmapFontTextParser.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bitmapFontTextParser",
    ()=>bitmapFontTextParser
]);
"use strict";
const bitmapFontTextParser = {
    test (data) {
        return typeof data === "string" && data.startsWith("info face=");
    },
    parse (txt) {
        const items = txt.match(/^[a-z]+\s+.+$/gm);
        const rawData = {
            info: [],
            common: [],
            page: [],
            char: [],
            chars: [],
            kerning: [],
            kernings: [],
            distanceField: []
        };
        for(const i in items){
            const name = items[i].match(/^[a-z]+/gm)[0];
            const attributeList = items[i].match(/[a-zA-Z]+=([^\s"']+|"([^"]*)")/gm);
            const itemData = {};
            for(const i2 in attributeList){
                const split = attributeList[i2].split("=");
                const key = split[0];
                const strValue = split[1].replace(/"/gm, "");
                const floatValue = parseFloat(strValue);
                const value = isNaN(floatValue) ? strValue : floatValue;
                itemData[key] = value;
            }
            rawData[name].push(itemData);
        }
        const font = {
            chars: {},
            pages: [],
            lineHeight: 0,
            fontSize: 0,
            fontFamily: "",
            distanceField: null,
            baseLineOffset: 0
        };
        const [info] = rawData.info;
        const [common] = rawData.common;
        var _rawData_distanceField;
        const [distanceField] = (_rawData_distanceField = rawData.distanceField) !== null && _rawData_distanceField !== void 0 ? _rawData_distanceField : [];
        if (distanceField) {
            font.distanceField = {
                range: parseInt(distanceField.distanceRange, 10),
                type: distanceField.fieldType
            };
        }
        font.fontSize = parseInt(info.size, 10);
        font.fontFamily = info.face;
        font.lineHeight = parseInt(common.lineHeight, 10);
        const page = rawData.page;
        for(let i = 0; i < page.length; i++){
            font.pages.push({
                id: parseInt(page[i].id, 10) || 0,
                file: page[i].file
            });
        }
        const map = {};
        font.baseLineOffset = font.lineHeight - parseInt(common.base, 10);
        const char = rawData.char;
        for(let i = 0; i < char.length; i++){
            const charNode = char[i];
            const id = parseInt(charNode.id, 10);
            var _charNode_letter, _ref;
            let letter = (_ref = (_charNode_letter = charNode.letter) !== null && _charNode_letter !== void 0 ? _charNode_letter : charNode.char) !== null && _ref !== void 0 ? _ref : String.fromCharCode(id);
            if (letter === "space") letter = " ";
            map[id] = letter;
            font.chars[letter] = {
                id,
                // texture deets..
                page: parseInt(charNode.page, 10) || 0,
                x: parseInt(charNode.x, 10),
                y: parseInt(charNode.y, 10),
                width: parseInt(charNode.width, 10),
                height: parseInt(charNode.height, 10),
                xOffset: parseInt(charNode.xoffset, 10),
                yOffset: parseInt(charNode.yoffset, 10),
                xAdvance: parseInt(charNode.xadvance, 10),
                kerning: {}
            };
        }
        const kerning = rawData.kerning || [];
        for(let i = 0; i < kerning.length; i++){
            const first = parseInt(kerning[i].first, 10);
            const second = parseInt(kerning[i].second, 10);
            const amount = parseInt(kerning[i].amount, 10);
            font.chars[map[second]].kerning[map[first]] = amount;
        }
        return font;
    }
};
;
 //# sourceMappingURL=bitmapFontTextParser.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/asset/bitmapFontXMLParser.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bitmapFontXMLParser",
    ()=>bitmapFontXMLParser
]);
"use strict";
const bitmapFontXMLParser = {
    test (data) {
        const xml = data;
        return typeof xml !== "string" && "getElementsByTagName" in xml && xml.getElementsByTagName("page").length && xml.getElementsByTagName("info")[0].getAttribute("face") !== null;
    },
    parse (xml) {
        const data = {
            chars: {},
            pages: [],
            lineHeight: 0,
            fontSize: 0,
            fontFamily: "",
            distanceField: null,
            baseLineOffset: 0
        };
        const info = xml.getElementsByTagName("info")[0];
        const common = xml.getElementsByTagName("common")[0];
        const distanceField = xml.getElementsByTagName("distanceField")[0];
        if (distanceField) {
            data.distanceField = {
                type: distanceField.getAttribute("fieldType"),
                range: parseInt(distanceField.getAttribute("distanceRange"), 10)
            };
        }
        const page = xml.getElementsByTagName("page");
        const char = xml.getElementsByTagName("char");
        const kerning = xml.getElementsByTagName("kerning");
        data.fontSize = parseInt(info.getAttribute("size"), 10);
        data.fontFamily = info.getAttribute("face");
        data.lineHeight = parseInt(common.getAttribute("lineHeight"), 10);
        for(let i = 0; i < page.length; i++){
            data.pages.push({
                id: parseInt(page[i].getAttribute("id"), 10) || 0,
                file: page[i].getAttribute("file")
            });
        }
        const map = {};
        data.baseLineOffset = data.lineHeight - parseInt(common.getAttribute("base"), 10);
        for(let i = 0; i < char.length; i++){
            const charNode = char[i];
            const id = parseInt(charNode.getAttribute("id"), 10);
            var _charNode_getAttribute, _ref;
            let letter = (_ref = (_charNode_getAttribute = charNode.getAttribute("letter")) !== null && _charNode_getAttribute !== void 0 ? _charNode_getAttribute : charNode.getAttribute("char")) !== null && _ref !== void 0 ? _ref : String.fromCharCode(id);
            if (letter === "space") letter = " ";
            map[id] = letter;
            data.chars[letter] = {
                id,
                // texture deets..
                page: parseInt(charNode.getAttribute("page"), 10) || 0,
                x: parseInt(charNode.getAttribute("x"), 10),
                y: parseInt(charNode.getAttribute("y"), 10),
                width: parseInt(charNode.getAttribute("width"), 10),
                height: parseInt(charNode.getAttribute("height"), 10),
                // render deets..
                xOffset: parseInt(charNode.getAttribute("xoffset"), 10),
                yOffset: parseInt(charNode.getAttribute("yoffset"), 10),
                // + baseLineOffset,
                xAdvance: parseInt(charNode.getAttribute("xadvance"), 10),
                kerning: {}
            };
        }
        for(let i = 0; i < kerning.length; i++){
            const first = parseInt(kerning[i].getAttribute("first"), 10);
            const second = parseInt(kerning[i].getAttribute("second"), 10);
            const amount = parseInt(kerning[i].getAttribute("amount"), 10);
            data.chars[map[second]].kerning[map[first]] = amount;
        }
        return data;
    }
};
;
 //# sourceMappingURL=bitmapFontXMLParser.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/asset/bitmapFontXMLStringParser.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bitmapFontXMLStringParser",
    ()=>bitmapFontXMLStringParser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$bitmapFontXMLParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/asset/bitmapFontXMLParser.mjs [app-client] (ecmascript)");
;
;
"use strict";
const bitmapFontXMLStringParser = {
    test (data) {
        if (typeof data === "string" && data.includes("<font>")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$bitmapFontXMLParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bitmapFontXMLParser"].test(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().parseXML(data));
        }
        return false;
    },
    parse (data) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$bitmapFontXMLParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bitmapFontXMLParser"].parse(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().parseXML(data));
    }
};
;
 //# sourceMappingURL=bitmapFontXMLStringParser.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/asset/loadBitmapFont.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bitmapFontCachePlugin",
    ()=>bitmapFontCachePlugin,
    "loadBitmapFont",
    ()=>loadBitmapFont
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/loader/parsers/LoaderParser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$copySearchParams$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/assets/utils/copySearchParams.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/path.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$BitmapFont$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/BitmapFont.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$bitmapFontTextParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/asset/bitmapFontTextParser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$bitmapFontXMLStringParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/text-bitmap/asset/bitmapFontXMLStringParser.mjs [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
"use strict";
const validExtensions = [
    ".xml",
    ".fnt"
];
const bitmapFontCachePlugin = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].CacheParser,
        name: "cacheBitmapFont"
    },
    test: (asset)=>asset instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$BitmapFont$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BitmapFont"],
    getCacheableAssets (keys, asset) {
        const out = {};
        keys.forEach((key)=>{
            out[key] = asset;
            out["".concat(key, "-bitmap")] = asset;
        });
        out["".concat(asset.fontFamily, "-bitmap")] = asset;
        return out;
    }
};
const loadBitmapFont = {
    extension: {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExtensionType"].LoadParser,
        priority: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$loader$2f$parsers$2f$LoaderParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LoaderParserPriority"].Normal
    },
    /** used for deprecation purposes */ name: "loadBitmapFont",
    id: "bitmap-font",
    test (url) {
        return validExtensions.includes(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["path"].extname(url).toLowerCase());
    },
    async testParse (data) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$bitmapFontTextParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bitmapFontTextParser"].test(data) || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$bitmapFontXMLStringParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bitmapFontXMLStringParser"].test(data);
    },
    async parse (asset, data, loader) {
        const bitmapFontData = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$bitmapFontTextParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bitmapFontTextParser"].test(asset) ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$bitmapFontTextParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bitmapFontTextParser"].parse(asset) : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$asset$2f$bitmapFontXMLStringParser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bitmapFontXMLStringParser"].parse(asset);
        const { src } = data;
        const { pages } = bitmapFontData;
        const textureUrls = [];
        const textureOptions = bitmapFontData.distanceField ? {
            scaleMode: "linear",
            alphaMode: "premultiply-alpha-on-upload",
            autoGenerateMipmaps: false,
            resolution: 1
        } : {};
        for(let i = 0; i < pages.length; ++i){
            const pageFile = pages[i].file;
            let imagePath = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["path"].join(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$path$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["path"].dirname(src), pageFile);
            imagePath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$assets$2f$utils$2f$copySearchParams$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["copySearchParams"])(imagePath, src);
            textureUrls.push({
                src: imagePath,
                data: textureOptions
            });
        }
        const loadedTextures = await loader.load(textureUrls);
        const textures = textureUrls.map((url)=>loadedTextures[url.src]);
        const bitmapFont = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$text$2d$bitmap$2f$BitmapFont$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BitmapFont"]({
            data: bitmapFontData,
            textures
        }, src);
        return bitmapFont;
    },
    async load (url, _options) {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DOMAdapter"].get().fetch(url);
        return await response.text();
    },
    async unload (bitmapFont, _resolvedAsset, loader) {
        await Promise.all(bitmapFont.pages.map((page)=>loader.unload(page.texture.source._sourceOrigin)));
        bitmapFont.destroy();
    }
};
;
 //# sourceMappingURL=loadBitmapFont.mjs.map
}),
]);

//# sourceMappingURL=5703a_pixi_js_lib_scene_dd695a88._.js.map