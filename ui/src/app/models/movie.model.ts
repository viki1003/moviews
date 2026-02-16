export interface Movie {
    id: number;
    title: string;
    year: number;
    genre: string;
    logic: string;
    imdbId?: string;
    tmdbId?: string;
    averageRating: number;
    voteCount: number;
    language?: string;
}
