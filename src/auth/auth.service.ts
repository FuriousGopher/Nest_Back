import { Inject, Injectable } from '@nestjs/common';
import { RegistrationDto } from './dto/registration.dto';
import { UsersRepository } from '../users/users.repository';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../db/schemas/users.schema';
import { Model } from 'mongoose';
import { v4 } from 'uuid';
import { add } from 'date-fns';
import { MailAdapter } from '../utils/mailer/mail-adapter';
import { ConfirmationCodeDto } from './dto/confirmation-code.dto';
import { RecoveryEmailDto } from './dto/recoveryEmail.dto';
import { EmailResendingDto } from './dto/recoveryEmailResending.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersRepository)
    protected userRepository: UsersRepository,
    @Inject(MailAdapter)
    protected mailAdapter: MailAdapter,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async registration(registrationDto: RegistrationDto) {
    try {
      const passwordSalt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(
        registrationDto.password,
        passwordSalt,
      );
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
    return await this.userRepository.confirmationOfEmail(
      confirmationCode.toString(),
    );
  }

  async recoveryPass(recoveryDto: RecoveryEmailDto) {
    const findUserByEmail = await this.userRepository.checkEmail(
      recoveryDto.email,
    );
    if (findUserByEmail) {
      const newConfirmationCode = v4();
      const newExpirationDate = add(new Date(), {
        hours: 5,
        minutes: 3,
      });
      await this.mailAdapter.sendPasswordRecoveryMail(
        findUserByEmail.accountData.login,
        findUserByEmail.accountData.email,
        newConfirmationCode,
      );
      return await this.userRepository.updateEmailConfirmationData(
        findUserByEmail.id,
        newConfirmationCode,
        newExpirationDate,
      );
    }
    return true;
  }

  async emailResending(emailForResending: EmailResendingDto) {
    const checkEmail = await this.userRepository.checkEmail(
      emailForResending.email,
    );
    if (checkEmail) {
      const newConfirmationCode = v4();
      const newExpirationDate = add(new Date(), {
        hours: 5,
        minutes: 3,
      });
      await this.mailAdapter.sendRegistrationMail(
        checkEmail.accountData.login,
        checkEmail.accountData.email,
        newConfirmationCode,
      );
      return await this.userRepository.updateEmailConfirmationData(
        checkEmail.id,
        newConfirmationCode,
        newExpirationDate,
      );
    }
    return true;
  }

  async newPas(newPassword: string, recoveryCode: string) {
    const findUserByRecoveryCode =
      await this.userRepository.findByConfirmationCode(recoveryCode);
    if (findUserByRecoveryCode) {
      const dateNow = new Date();
      if (
        dateNow < findUserByRecoveryCode!.emailConfirmation!.expirationDate!
      ) {
        const passwordSalt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, passwordSalt);
        return await this.userRepository.updatePassword(
          findUserByRecoveryCode.id,
          passwordHash,
        );
      }
    }
    return true;
  }

  async checkCredentials(loginOrEmail: string, password: string) {
    const findUserByLoginOrEmail = await this.userRepository.findByLoginOrEmail(
      loginOrEmail,
    );

    if (!findUserByLoginOrEmail) return false;
    if (!findUserByLoginOrEmail.emailConfirmation.isConfirmed) return false;

    const passwordHash = await bcrypt.hash(
      password,
      findUserByLoginOrEmail.accountData.passwordHash,
    );

    const checkPassword =
      passwordHash === findUserByLoginOrEmail.accountData.passwordHash;
    if (checkPassword) {
      return {
        id: findUserByLoginOrEmail.id,
        login: findUserByLoginOrEmail.accountData.login,
        email: findUserByLoginOrEmail.accountData.email,
        createdAt: findUserByLoginOrEmail.accountData.createdAt,
      };
    }
    return false;
  }
}
