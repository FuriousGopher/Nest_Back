import { Inject, Injectable } from '@nestjs/common';
import { RegistrationDto } from './dto/registration.dto';
import { SaRepository } from '../sa/sa.repository';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../db/schemas/users.schema';
import { Model } from 'mongoose';
import { v4 } from 'uuid';
import { add } from 'date-fns';
import { ConfirmationCodeDto } from './dto/confirmation-code.dto';
import { RecoveryEmailDto } from './dto/recoveryEmail.dto';
import * as bcrypt from 'bcryptjs';
import { MailAdapter } from '../utils/mailer/mail-adapter';

@Injectable()
export class AuthService {
  constructor(
    @Inject(SaRepository)
    protected saRepository: SaRepository,
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
          isConfirmed: false,
        },
      });

      await this.mailAdapter.sendRegistrationMail(
        newUser.accountData.login,
        newUser.accountData.email,
        newUser.emailConfirmation.confirmationCode!,
      );
      const savedUser = await this.saRepository.saveNewUser(newUser);
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
    const user = await this.saRepository.findByConfirmationCode(
      confirmationCode.code,
    );
    if (!user) return false;

    const currentDateTime = new Date().toString();
    const expirationDate = user.emailConfirmation.expirationDate;
    const isConfirmed = user.emailConfirmation.isConfirmed;
    if (expirationDate! > currentDateTime && isConfirmed) {
      return false;
    }
    return await this.saRepository.confirmationOfEmail(confirmationCode.code);
  }

  async recoveryPass(recoveryDto: RecoveryEmailDto) {
    const findUserByEmail = await this.saRepository.checkEmail(
      recoveryDto.email,
    );
    if (!findUserByEmail) return true;
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
      return await this.saRepository.updateEmailConfirmationData(
        findUserByEmail._id.toString(),
        newConfirmationCode,
        newExpirationDate.toString(),
      );
    }
    return true;
  }

  async emailResending(emailForResending: RecoveryEmailDto) {
    const checkEmail = await this.saRepository.checkEmail(
      emailForResending.email,
    );
    if (!checkEmail) return;
    if (checkEmail.emailConfirmation.isConfirmed) return false;
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
      return await this.saRepository.updateEmailConfirmationData(
        checkEmail._id.toString(),
        newConfirmationCode,
        newExpirationDate.toString(),
      );
    }
  }

  async newPas(newPassword: string, recoveryCode: string) {
    const findUserByRecoveryCode =
      await this.saRepository.findByConfirmationCode(recoveryCode);
    if (findUserByRecoveryCode) {
      const dateNow = new Date().toString();
      if (
        dateNow < findUserByRecoveryCode!.emailConfirmation!.expirationDate!
      ) {
        const passwordSalt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, passwordSalt);
        return await this.saRepository.updatePassword(
          findUserByRecoveryCode._id.toString(),
          passwordHash,
        );
      }
    }
    return true;
  }

  async checkCredentials(loginOrEmail: string, password: string) {
    const findUserByLoginOrEmail = await this.saRepository.findByLoginOrEmail(
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
        id: findUserByLoginOrEmail._id.toString(),
        login: findUserByLoginOrEmail.accountData.login,
        email: findUserByLoginOrEmail.accountData.email,
        createdAt: findUserByLoginOrEmail.accountData.createdAt,
      };
    }
    return false;
  }
}
