declare class Auth {
    private next;
    private authContainer?;
    currentAccount: any;
    private form?;
    constructor(next: (wallet?: string) => Promise<void>);
    init(): Promise<void>;
    guest(): void;
    connect(): Promise<void>;
    alert(type: number): void;
    private handleChainChanged;
    handleAccountsChanged(accounts: any): void;
}
export default Auth;
