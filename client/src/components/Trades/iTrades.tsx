export interface iTrades {
    _id: string;
    portfolio: string;
    earliestExpiration: Date;
    underlying: string;
    status: string;
    side: string;
    openDate: Date;
    entryCost: number;
    target: number;
    netReturn: number;
    spreadCount: number;
    strikes: [number];
    instrumentTypes: [string];
    openingSpreadType: string;
}
