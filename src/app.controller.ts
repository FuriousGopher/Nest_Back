import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello() {
    const options = {
      method: 'GET',
      url: 'https://jokes-by-api-ninjas.p.rapidapi.com/v1/jokes',
      headers: {
        'X-RapidAPI-Key': 'd240032d12msh45bcebc3d5f5191p154168jsn545e5551cd19',
        'X-RapidAPI-Host': 'jokes-by-api-ninjas.p.rapidapi.com',
      },
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }
}
