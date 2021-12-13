import { Injectable} from "@nestjs/common";
import { ThrottlerGuard} from "@nestjs/throttler";

@Injectable()
export class RateLimiterGuard extends ThrottlerGuard {
    protected getTracker(req: Record<string, any>): string {
        return req.headers["x-real-ip"];
    }
}