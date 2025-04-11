// Perlin noise implementation
class PerlinNoise {
    constructor(seed = Math.random()) {
        this.seed = seed;
        this.permutation = this.generatePermutation();
        this.grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
    }

    generatePermutation() {
        // Generate a random permutation table based on seed
        const perm = Array(512);
        const p = Array(256).fill(0).map((_, i) => i);
        
        // Fisher-Yates shuffle
        let j, tmp;
        for (let i = p.length - 1; i > 0; i--) {
            j = Math.floor(this.seededRandom() * (i + 1));
            tmp = p[i];
            p[i] = p[j];
            p[j] = tmp;
        }
        
        // Extend the permutation to avoid overflow checks
        for (let i = 0; i < 512; i++) {
            perm[i] = p[i & 255];
        }
        
        return perm;
    }
    
    seededRandom() {
        // Simple seeded random function
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
    
    fade(t) {
        // Smoothing function 6t^5 - 15t^4 + 10t^3
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    lerp(a, b, t) {
        // Linear interpolation
        return a + t * (b - a);
    }
    
    grad(hash, x, y, z) {
        // Convert low 4 bits of hash code into 12 gradient directions
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    noise2D(x, y) {
        // 2D Perlin noise implementation
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        const u = this.fade(x);
        const v = this.fade(y);
        
        const A = this.permutation[X] + Y;
        const AA = this.permutation[A];
        const AB = this.permutation[A + 1];
        const B = this.permutation[X + 1] + Y;
        const BA = this.permutation[B];
        const BB = this.permutation[B + 1];
        
        return this.lerp(
            this.lerp(
                this.grad(this.permutation[AA], x, y, 0),
                this.grad(this.permutation[BA], x - 1, y, 0),
                u
            ),
            this.lerp(
                this.grad(this.permutation[AB], x, y - 1, 0),
                this.grad(this.permutation[BB], x - 1, y - 1, 0),
                u
            ),
            v
        );
    }
    
    noise3D(x, y, z) {
        // 3D Perlin noise implementation
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        
        const A = this.permutation[X] + Y;
        const AA = this.permutation[A] + Z;
        const AB = this.permutation[A + 1] + Z;
        const B = this.permutation[X + 1] + Y;
        const BA = this.permutation[B] + Z;
        const BB = this.permutation[B + 1] + Z;
        
        return this.lerp(
            this.lerp(
                this.lerp(
                    this.grad(this.permutation[AA], x, y, z),
                    this.grad(this.permutation[BA], x - 1, y, z),
                    u
                ),
                this.lerp(
                    this.grad(this.permutation[AB], x, y - 1, z),
                    this.grad(this.permutation[BB], x - 1, y - 1, z),
                    u
                ),
                v
            ),
            this.lerp(
                this.lerp(
                    this.grad(this.permutation[AA + 1], x, y, z - 1),
                    this.grad(this.permutation[BA + 1], x - 1, y, z - 1),
                    u
                ),
                this.lerp(
                    this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
                    this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1),
                    u
                ),
                v
            ),
            w
        );
    }
    
    fbm(x, y, octaves, frequency, amplitude) {
        // Fractional Brownian Motion - sums multiple noise functions with different frequencies
        let result = 0;
        let amp = amplitude;
        let freq = frequency;
        
        for (let i = 0; i < octaves; i++) {
            result += this.noise2D(x * freq, y * freq) * amp;
            freq *= 2;
            amp *= 0.5;
        }
        
        return result;
    }
}

