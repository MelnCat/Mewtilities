# Cat Gene Helper Plan

theres pushy north cant forget

## Species

Trivial

## Wind

If it's null, `OO`.

Otherwise, if north, test with `SS`.
- `NN`: 100% trade (NS)
- `NO`: 50% trade 50% south (NS, SO)
If south, test with `NN`.
- `SS`: 100% trade (NS)
- `SO`: 50% trade 50% north (NS, NO)

Can't tell if a cat is north or south, so it'll rely on % of trade


## Fur

If it's a longhair, then `LL`.

Otherwise, test with `LL`.

- `SS`: 100% shorthair (SS, SL)
- `SL`: 50% shorthair 50% longhair (SL, LL)

## Color (Not Albino)

### Color Type

If trade, then check the color layers: 
- if they're opposite then its {SO}
- if they're both orange tint then OO (or if trade is snow)
- if they're both black tint then BB (or if trade is snow)

If not, use the wind and color to determine one of them

If North and `O?`, the second can be determined by breeding with `SS` & `BB`
- NS:
	- OO: 50% BO 50% OB
	- OB: 25% BO 25% OB 50% BB
- SO:
	- OO: 50% B 50% O
	- OB: 25% O 75% B
	
If South and `O?`, the second can be determined by breeding with `NN` & `BB`
- NS:
	- OO: 50% BO 50% OB
	- OB: 25% BO 25% OB 50% BB
- NO:
	- OO: 50% B 50% O
	- OB: 75% B 25% O

Rest is similar

### Color Dilution

If dilute, then `DD`.

If not, test with a `DD`.
- FF: 100% full (FD)
- FD: 50% full 50% dilute (FD, FF)

### Color Density

Just look at it

## Color (Albino)

### Color Type

If trade, try breeding with a `NN` (or `SS`) that's `BB` or `OO` with `0` white

Assuming `NN` and `BB` (the rest is left as an exercise to the reader)
- NS:
	- OO: 50% BO, 50% OB
	- {BO}: 50% BB, 25% OB, 25% BO
	- BB: 100% BB
- NN:
	- OO: 50% B, 50% O
	- {BO}: 75% B, 25% O
	- BB: 100% B


If north, try breeding with a `SS` that's `BB` with `0` white
- NS:
	- OO: 50% BO, 50% OB
	- {BO}: 50% BB, 25% OB, 25% BO
	- BB: 100% BB
- SO:
	- OO: 50% O, 50% B
	- {BO}: 75% B, 25% O
	- BB: 100% B
	
If south, try breeding with a `NN` that's `BB` with `0` white
- NS:
	- OO: 50% BO, 50% OB
	- {BO}: 50% BB, 25% OB, 25% BO
	- BB: 100% BB
- NO:
	- OO: 50% B, 50% O
	- {BO}: 75% B, 25% O
	- BB: 100% B

### Color Dilution

Test with whatever. Make sure it is `DD` and `0` white though.

- FF: 100% full (FD)
- FD: 50% full 50% dilute (FD, DD)
- DD: 100% dilute (DD)

### Color Density

Test with a `3` color density cat with `0` white

Check the base color

- 1: [1, 2, 3]
- 2: [2, 3]
- 3: [3]
- 4: [3, 4]

## Color (Null)

You don't

## Pattern

### Presence

If solid then `NN`.

Otherwise test with `NN`
- YY: 100% Yes (YN)
- YN: 50% yes 50% no (YN, NN)

### Spotting

If solid, see [Pattern (Albino)](#pattern-albino)

Just visually look at it.

### Spotting (Albino)

Test it with a `PP` pattern `YY` (and `0` white if albino) cat.
- TT: 100% TP
- MM: 100% MP
- {TM}: 50% TP 50% MP
- SS: 100% SP
- {MS}: 50% MP 50% SP
- {TS}: 50% TP 50% SP
- PP: 100% PP
- {TP}: 50% TP 50% PP
- {MP}: 50% MP 50% PP
- {SP}: 50% SP: 50% PP

### Spotting (Null)

You don't

## White Marks

Use your eyes maybe

## White Marks (Hidden)

If there are no white marks then do this:

- Test with a `YY0`. If there are no white marks in children (100%), the white number is 0.
- Test with a `NN10`. If there are no white marks in children (100%), the white presence is NN.
- If both, then NN0

Test cat with a `NN10`.
- NN: 0% has white
- {YN}: 50% has white
- YY: 100% has white

Test cat with a `YY4`, needs LOTS of data!!
- 0: You already know
- 1: [1, 2, 3, 4]
- 2: [2, 3, 4]
- 3: [3, 4]
- 4: [4]
- 5: [4, 5]
- 6: [4, 5, 6]
- 7: [4, 5, 6, 7]
- 8: [4, 5, 6, 7, 8]
- 9: [4, 5, 6, 7, 8, 9]
- 10: [4, 5, 6, 7, 8, 9, 10]

Maybe check with a `YY10` too?

Test cat with a `YY10I` (good luck finding one).
- C: 50% C 50% I
- P: 50% P 50% I
- L: 50% L 50% I
- R: 50% R 50% I
- I: 100%

## Accent Color

If it's a mercat just look at it

If not, test with any mercat with low white with same accent alleles. Assuming `LL`:
- BB: 100% BL
- LL: 100% LL
- BL: 50% BL 50% LL
- RR: 100% LR
- BR: 50% BL 50% LR
- LR: 50% LL 50% LR
- YY: 100% LY
- BY: 50% LY 50% BL
- LY: 50% LL 50% LY
- RY: 50% LR 50% LY

## Growth

hahaha