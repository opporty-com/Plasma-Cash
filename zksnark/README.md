### ZK-SNARKS
Non-interactive zero-knowledge proofs are a variant of zero-knowledge proofs in which no interaction is necessary between prover and verifier. 


### The Scheme

```
Generator (C circuit, λ is ️):
(pk, vk) = G(λ, C)
Prover (x pub inp, w sec inp):
π = P(pk, x, w)
Verifier:
V(vk, x, π) == (∃ w s.t. C(x,w))

```
