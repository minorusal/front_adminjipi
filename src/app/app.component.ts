import { Component, OnInit } from '@angular/core';
import { CalculatorService } from './calculator.service';
import { CipherService } from './cipher.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  {
  // isConnected: boolean = false;

  // text: any = {
  //   "emp_id_origen": 69,
  //   "usu_id_origen": 87,
  //   "emp_id_destino": 157,
  //   "divisa": "USD",
  //   "productos": [],
  
  // };
  // textCrypt!: string;
  // textDecrypt!: string;
  // textDecriptApi!: string;
  
  
  plainTextToEncrypt: string = ''; // Entrada para texto a cifrar
  cipherTextToDecrypt: string = ''; // Entrada para texto a descifrar
  encryptedText: string = ''; // Resultado del texto cifrado
  decryptedText: any = ''; // Resultado del texto descifrado
  key: string = 'CR3D1BU51N355K3YC1PH3R';
  decryptedTextParsed: any;

  constructor(
    private calculatorService: CalculatorService,
    private cipherService: CipherService,
  ) { }

  // async ngOnInit() {
  //   try {
      
  //     this.textCrypt = await this.cipherService.encryptData(JSON.stringify({
  //       "email": "test@test.com",
  //       "password": "123456"
  //     }), this.key);
      
  //     this.textDecrypt = await this.cipherService.decryptData('U2FsdGVkX19t7dyd8gx/DRq0ObjH1/ei247ALqy/', this.key);
  //     console.log('VALOR DE  TEXTO DESENCRIPTADO', this.textDecrypt)

     
  //   } catch (error) {
  //     console.log('TESTING ERROR', error);
  //   }
  // }
  async encryptData() {
    try {
      this.encryptedText = await this.cipherService.encryptData(this.plainTextToEncrypt, this.key);
      console.log(this.encryptedText)
    } catch (error) {
      console.log('Error al cifrar:', error);
    }
  }

  async decryptData() {
    try {
      this.decryptedText = await this.cipherService.decryptData(this.cipherTextToDecrypt, this.key);
      this.decryptedTextParsed = JSON.parse(this.decryptedText);
    } catch (error) {
      console.log('Error al descifrar:', error);
    }
  }

  emitirEvento() {
    const eventData = {
      "usu_id_comprador": 497,
      "cot_delivery": "2024-10-16",
      "cot_comentario": "Sin comentario",
      "cmetodo_id": 2,
      "address_id": 1516,
      "diasCredito": 30,
      "credito": "1570.00",
      "products": [
          {
              "prod_id": 68,
              "cp_cantidad": 2,
              "comentario": "Sin comentario"
          }
      ],
      "credito_dias": 2
  }; // Personaliza el objeto según lo que necesites
    this.calculatorService.emit('crea-cotizacion', eventData); // Cambia 'miEvento' por el nombre de tu evento
  }
  
}
