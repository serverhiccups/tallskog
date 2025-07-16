// https://inspirnathan.com/posts/162-recursive-descent-parser-for-math-expressions-in-javascript

export class Tokeniser {
	private input: string;
	private cursor: number;
	constructor(input: string) {
		this.input = input;
		this.cursor = 0;
	}

	public hasNext(): boolean {
		return this.cursor < this.input.length;
	}

	private remainingInput(): string {
		return this.input.slice(this.cursor);
	}

	public skipWhitespace(): void {
		const whitespaceMatch = /^\s+/.exec(this.remainingInput());
		if (whitespaceMatch !== null) {
			this.cursor += whitespaceMatch[0].length;
		}
	}

	public next(pattern: RegExp, captureGroup: number = 0): string | null {
		if (this.remainingInput() == "") return null;

		this.skipWhitespace();

		const match = pattern.exec(this.remainingInput());
		if (match == null) return null;

		this.cursor += match[0].length;
		return match[captureGroup];
	}

	public has(pattern: RegExp): boolean {
		if (this.remainingInput() == "") return false;

		this.skipWhitespace();

		const match = pattern.exec(this.remainingInput());
		if (match == null || match.index !== 0) return false;
		return true;
	}
}
