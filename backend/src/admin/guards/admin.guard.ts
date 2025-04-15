import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-admin-token'];
    
    this.logger.log(`Admin guard checking token: ${token}`);
    
    // Accept admin-authenticated or admin
    const isValid = token === 'admin-authenticated' || token === 'admin';
    
    if (isValid) {
      this.logger.log('Admin guard: token is valid');
    } else {
      this.logger.warn('Admin guard: token is invalid');
    }
    
    return isValid;
  }
}