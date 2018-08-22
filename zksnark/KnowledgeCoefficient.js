

class KnowledgeCoefficient {
  constructor(a, alpha, coeffs, p) {
    this.field = new PrimeField(p);
    this.a = a;
    this.alpha = alpha;
    this.coeffs = coeffs;
    this.b = this.field.mul(this.a, this.alpha);
  }

  respond(gamma) {
    this.a2 = this.field.mul(this.a, gamma);
    this.b2 = this.field.mul(this.b, gamma);
    this.gamma = gamma;
  }

  generateHidings(s, d) {
    let g = 1;
    let p = this.field.oneElement();
    let hidings = [];
    let hidingsalpha = [];

    for (let d = 0; d < this.coeffs.length ; d++) {
      if (d>0)
        for (let j = 0; j<d; j++) p = this.field.mul(p, s);
      let hid = this.field.mul(p, g)
      hidings.push(hid);
      hidingsalpha.push(this.field.mul(hid, this.alpha));

    }
    return { hidings, hidingsalpha };
  }

  evaluatePolynomial(hidings) {
    let P = this.field.nullElement();

    for (let d=0; d< this.coeffs.length; d++) {
      P = this.field.add(P, this.field.mul(this.coeffs[d],  hidings[d] ));
    }

    return P;
  }

  toString() {
    console.log('(a,b) = ', this.a, ' ', this.b);
    console.log('alpha = ', this.alpha);
    console.log('(a\',b\') = ', this.a2, ' ', this.b2);
    console.log('gamma = ', this.gamma);
  }
}