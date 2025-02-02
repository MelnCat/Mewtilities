f = (x) => {
	const s = x.split("\n\n");
	const vals = Object.fromEntries(
		s[0]
			.split("\n")
			.map(x => x.split(": "))
			.map(x => [x[0], !!+x[1]])
	);
	let ops = s[1]
		.split("\n")
		.map(x => x.match(/(\w+) (\w+) (\w+) -> (\w+)/))
		.map(x => ({
			first: x[1],
			second: x[3],
			op: x[2],
			out: x[4],
		}));
	const test = (ops, n, m) => {
		const twovals = structuredClone(vals)
		Object.keys(twovals).map(x => x.startsWith("y") || x.startsWith("x") ? (() => {  twovals[x] =false})() : 1)
		n.toString(2)
			.split("").reverse()
			.map((x, i) => (twovals[`x${i.toString().padStart(2, 0)}`] = !!+x));
		m.toString(2)
			.split("").reverse()
			.map((x, i) => (twovals[`y${i.toString().padStart(2, 0)}`] = !!+x));
		let checks = ops;
		let count = 0;
		while (checks.length) {
			count++;
			if (count > 1000) break;
			let newChecks = [];
			for (const a of ops) {
				if (!(a.first in twovals && a.second in twovals)) {
					newChecks.push(a);
					continue;
				}
				if (a.op === "AND") twovals[a.out] = twovals[a.first] && twovals[a.second];
				if (a.op === "OR") twovals[a.out] = twovals[a.first] || twovals[a.second];
				if (a.op === "XOR") twovals[a.out] = twovals[a.first] !== twovals[a.second];
			}
			checks = newChecks;
		}
		if (count > 1000) return 0;
		return Object.entries(twovals)
			.filter(x => x[0].startsWith("z"))
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map((x, i) => x[1] * 2 ** i)
			.reduce((l, c) => l + c);
	};
	const findRelevant = (out) => {
		let checks = [out]
		let result = [out]
		while (checks.length) {
			const first = checks.pop();
			const all = ops.filter(x => x.out === first);
			checks.push(...all.flatMap(x => [x.first, x.second]))
			result.push(first)
		}
		return [...new Set(result)]
	}
	
	const maybe = (findRelevant("z33")) // tweak manually
	const good = (findRelevant("z32"))
	const rel = maybe.filter(x=> !good.includes(x))
	const realSwaps = []
	for (const real of realSwaps) {
		const firstOp = ops.find(x => x.out === real[0])
		const secondOp = ops.find(x => x.out === real[1])
		ops = ops.map(x => x === firstOp ? {...x, out: secondOp.out} : x === secondOp ? {...x, out: firstOp.out} : x)

	}
	const swaps = [
	]
	if (0) for (let j = 0; j < 40; j++) {
		for (let i = 0; i < 100; i++) {
			const rand = Math.floor(Math.random() * 2 ** j)
			const rand2 = Math.floor(Math.random() * 2 ** j)
			if (test(ops, rand, rand2) !== (rand + rand2)) {console.log("NOT OK", j); return;}
				//else console.log("NOT OK");}
		}
	};
	
	//return (n,m) => test(ops, n, m)
	for (const firstOp of ops) {
		outer:
		for (const secondOp of ops.slice(ops.indexOf(firstOp) + 1)) {
			if (![firstOp.out, secondOp.out].some(x => rel.includes(x))) continue
			//if (!(swaps.flat().includes(firstOp.out) && swaps.flat().includes(secondOp.out))) continue;
			const newOps = ops.map(x => x === firstOp ? {...x, out: secondOp.out} : x === secondOp ? {...x, out: firstOp.out} : x)
			if (true) {
				for (let i = 0; i < 10; i++) {
					const rand = Math.floor(Math.random() * 2 ** 34)
					const rand2 = Math.floor(Math.random() * 2 ** 34)
					if (test(newOps, rand, rand2) !== (rand + rand2)) continue outer;
				}
				console.log(2, firstOp, secondOp)
			}
		}
	}
};
