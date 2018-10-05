### Boneh–Lynn–Shacham signature scheme

Boneh–Lynn–Shacham (BLS) signature scheme allows a user to verify that a signer is authentic. The scheme uses a bilinear pairing for verification, and signatures are elements of an elliptic curve group. Working in an elliptic curve group provides some defense against index calculus attacks, allowing shorter signatures than FDH signatures for a similar level of security. Signatures produced by the BLS signature scheme are often referred to as short signatures, BLS short signatures, or simply BLS signatures. The signature scheme is provably secure (the scheme is existentially unforgeable under adaptive chosen-message attacks) assuming both the existence of random oracles and the intractability of the computational Diffie–Hellman problem in a gap Diffie–Hellman group

### The Scheme

```
 e : G2 x G1 -> Fp12 ; ate pairing over BN curve
 Q in G2 ; fixed global parameter
 H : {str} -> G1
 s in Fr: secret key
 sQ in G2; public key
 s H(m) in G1; signature of m
 verify ; e(sQ, H(m)) = e(Q, s H(m))
```
#### Shamir Secret Sharing and Lagrange Interpolation  

Shamir's Secret Sharing is an algorithm in cryptography created by Adi Shamir. It is a form of secret sharing, where a secret is divided into parts, giving each participant its own unique part, where some of the parts or all of them are needed in order to reconstruct the secret.

Counting on all participants to combine the secret might be impractical, and therefore sometimes the threshold scheme is used where any k of the parts are sufficient to reconstruct the original secret.

![alt text](https://i.gyazo.com/b07cf212338f79f9e8863166fd19e7b9.png)



index.js implements k-n threshold signatures 

```
 npm install
 babel-node index.js
```
```
SecretKey.init()
```
Randomize `s`. secret key is a random number.

```
SecretKey.getPublicKey()
```
Get public key `sQ` for the secret key `s`.


```
SecretKey.sign(m)
```
Creste sign `s H(m)` from message m.

```
PublicKey.verify(sign, m)
```
Verify sign from public key and m and return true if signature is valid.

```
e(sQ, H(m)) == e(Q, s H(m))
```

```
SecretKey.getMasterSecretKey()
```

Create k-out-of-n secret sharing for the secret key.


```
Polynomial.eval(msk, x) 
```

Calculate f(x) = msk[0] + msk[1] x + ... + msk[k-1] x^{k-1}.

```
Signature.recover(signVec)
```

Recovers original signature

