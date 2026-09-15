export declare const digest: (value: string) => string;
export declare function text(value: unknown, name: string, min?: number, max?: number): string;
export declare function choice(value: unknown, name: string, options: string[]): string;
export declare function tags(value: unknown, name: string): string[];
export declare function link(value: unknown, name: string, host?: string): string;
export declare function accountInput(body: Record<string, unknown>): {
    email: string;
    password: string;
    phone: string;
    telegram: string;
};
export declare function profileInput(body: Record<string, unknown>): {
    headline: string;
    bio: string;
    city: string;
    level: string;
    work_format: string;
    work_type: string;
    availability: string;
    technologies: string[];
    skills: string[];
    languages: string[];
    experience: string;
    projects: {
        name: string;
        description: string;
        url: string;
    }[];
    linkedin: string;
    github: string;
    portfolio: string;
    contact_consent: boolean;
};
export declare function completion(p: {
    headline: string;
    bio: string;
    city: string;
    technologies: string[];
    skills: string[];
    avatar_url: string;
    projects: unknown;
    languages: string[];
    linkedin: string;
    github: string;
    contact_consent: boolean;
}): number;
//# sourceMappingURL=career.validation.d.ts.map