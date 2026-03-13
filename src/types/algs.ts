export type AlgCase = {
	id: string;
	name: string;
	alg: string;
	recognition?: string;
	mnemonic?: string;
	notes?: string;
};

export type AlgCategory = {
	name: string;
	subsets: { name: string; caseIds: string[] }[];
};

export type AlgCatalog = {
	categories: AlgCategory[];
};
