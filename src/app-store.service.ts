import fetch from 'node-fetch';

export class AppStoreService {
  public verifyReceipt = async (appStoreSecret: string, encodedReceipt: any) => {
    try {
      const body: any = JSON.stringify({
        // This means Apple only returns the latest receipt info instead of all transactions.
        'exclude-old-transactions': true,
        // Set in App Store Connect
        password: appStoreSecret,
        'receipt-data': encodedReceipt,
      });
      let getList = null;
      // Try to verify the receipt as if it's a real production receipt
      let productionResponse: any = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
        body,
        method: 'POST',
      });
      productionResponse = await productionResponse.json();

      // If it fails with status 21007 it means it's a Sandbox receipt
      if (productionResponse.status === 21007) {
        let sandboxResponse: any = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
          body,
          method: 'POST',
        });
        sandboxResponse = await sandboxResponse.json();

        if (sandboxResponse.latest_receipt_info.length > 0) {
          getList = await sandboxResponse.latest_receipt_info.sort((a: any, b: any) => {
            return this.getDate(b.purchase_date_ms) - this.getDate(a.purchase_date_ms);
          })[0];
        }
        return getList;
      } else {
        if (productionResponse.latest_receipt_info.length > 0) {
          getList = await productionResponse.latest_receipt_info.sort((a: any, b: any) => {
            return this.getDate(b.purchase_date_ms) - this.getDate(a.purchase_date_ms);
          })[0];
        }
        return getList;
      }
    } catch (error) {
      return null;
    }
  };
  public getDate(date: number) {
    return new Date(Number(date)).getTime();
  }
}
