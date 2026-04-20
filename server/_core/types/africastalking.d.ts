declare module "africastalking" {
  interface AfricasTalkingOptions {
    apiKey: string;
    username: string;
  }

  interface SMSSendOptions {
    to: string[];
    message: string;
    from?: string;
  }

  interface SMSService {
    send(options: SMSSendOptions): Promise<any>;
  }

  interface AfricasTalkingClient {
    SMS: SMSService;
  }

  function AfricasTalking(options: AfricasTalkingOptions): AfricasTalkingClient;
  export = AfricasTalking;
}
