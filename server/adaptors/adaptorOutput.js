export default class AdaptorOutput {
    importDate;
    executionDate;
    type;
    action;
    direction;
    symbol;
    instrumentType;
    description;
    value;
    size;
    price;
    commission;
    fees;
    underlying;
    expiration;
    strike;
    optionsType;
    orderNumber;

    constructor() {
        this.importDate = new Date();
    }
}
