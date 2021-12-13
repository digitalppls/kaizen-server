export class CreateUserTelegramDto{
    readonly chat_id: number;
    readonly username: string;
    readonly first_name: string;
    readonly last_name?: string;
    readonly language_code: string;
    readonly email?: string;
    readonly password?: string;
    readonly ref?: string;
}
