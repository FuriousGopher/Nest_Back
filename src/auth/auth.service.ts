import { Inject, Injectable } from '@nestjs/common';
import { RegistrationDto } from './dto/registration.dto';
import { UsersRepository } from '../users/users.repository';
import { genSalt, hash } from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../db/schemas/users.schema';
import { Model } from 'mongoose';
import { v4 } from 'uuid';
import { add } from 'date-fns';
import { MailAdapter } from '../utils/mailer/mail-adapter';
import { ConfirmationCodeDto } from './dto/confirmation-code.dto';
import { RecoveryEmailDto } from './dto/recoveryEmail.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersRepository)
    protected userRepository: UsersRepository,
    @Inject(MailAdapter)
    protected mailAdapter: MailAdapter,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  async registration(registrationDto: RegistrationDto) {
    try {
      const passwordSalt = await genSalt(10);
      const passwordHash = await hash(registrationDto.password, passwordSalt);
      const newUser = new this.userModel({
        accountData: {
          login: registrationDto.login,
          email: registrationDto.email,
          passwordHash: passwordHash,
        },
        emailConfirmation: {
          confirmationCode: v4().toString(),
          expirationDate: add(new Date(), {
            hours: 5,
            minutes: 3,
          }),
        },
      });

      await this.mailAdapter.sendRegistrationMail(
        newUser.accountData.login,
        newUser.accountData.email,
        newUser.emailConfirmation.confirmationCode!,
      );

      const savedUser = await this.userRepository.saveNewUser(newUser);
      return {
        id: savedUser._id,
        login: savedUser.accountData.login,
        email: savedUser.accountData.email,
        createdAt: savedUser.accountData.createdAt,
      };
    } catch (error) {
      console.error('An error occurred while creating a new user:', error);

      return {
        success: false,
        message: 'An error occurred while creating a new user.',
      };
    }
  }

  async confirmationOfEmail(confirmationCode: ConfirmationCodeDto) {
    return await this.userRepository.confirmationOfEmail(confirmationCode);
  }

  async recoveryPass(recoveryDto: RecoveryEmailDto) {
    const checkEmail = await this.userRepository.checkEmail(recoveryDto.email);
    if (checkEmail) {
      const newConfirmationCode = v4();
      await this.mailAdapter.sendRecoveryMail(
        checkEmail.accountData.login,
        checkEmail.accountData.email,
        newConfirmationCode,
      );
      return await this.userRepository.updateConfirmationCode(
        checkEmail._id,
        newConfirmationCode,
      );
    }
  }
}
