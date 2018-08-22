import bigInt from 'big-integer'

class ExNumber {

    static construct(n, b) {
        if (typeof n === 'number'){
            return bigInt.randBetween(bigInt.zero, bigInt(2).pow(n) );
        } else if (typeof n === 'string' ) {
            if (typeof b === 'number') {
                this.n = bigInt(n, b);
            }
            this.n = bigInt(n);
        } else
            this.n = n; 

        return this.n;
    }

    static mod(bign, p) {
        if (bign < 0) {
          return bign.mod(p).add(p);
        }
        
        return bign.mod(p);

    }

    static toByteArray(bign) {
        let ar = bign.toArray(256).value;
        for (let b in ar) {
            if (ar[b]>128) ar[b]=-256+ar[b];
        }
        return ar;
    }

    static signum(bign) {
        if (bign.isZero()) {
            return 0;
        } else if (bign.isNegative()) {
            return -1;
        } else {
            return 1;
        }
    }
    
    static testBit(bign, n) {
        return ( !bign.and( bigInt.one.shiftLeft(n) ).isZero() );
    }
}

export default ExNumber;