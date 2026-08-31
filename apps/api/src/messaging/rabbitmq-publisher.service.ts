import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Channel, ChannelModel, connect } from "amqplib";

@Injectable()
export class RabbitmqPublisherService implements OnModuleDestroy {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly config: ConfigService) {}

  async publish(exchange: string, routingKey: string, payload: object): Promise<void> {
    const channel = await this.getChannel();
    await channel.assertExchange(exchange, "topic", { durable: true });
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
      contentType: "application/json",
      persistent: true
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async getChannel(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    this.connection = await connect(this.config.getOrThrow<string>("app.rabbitmqUrl"));
    this.channel = await this.connection.createChannel();

    return this.channel;
  }
}
