import {Injectable} from '@nestjs/common';
import sgMail from "@sendgrid/mail";
import {ConfigService} from "@nestjs/config";
import {ApplyProduct} from "src/product/apply-product.schema";

@Injectable()
export class EmailService {

    private codes = [
        { email: 'a.mamoyan@gmail.com', code: "915771" },
        {email: "test@test.com", code: "100233"}
    ];

    constructor(
        private readonly configService: ConfigService
    ) {
        const SENDGRID_KEY = this.configService.get<string>("SENDGRID_KEY")
        if(SENDGRID_KEY) sgMail.setApiKey(SENDGRID_KEY)
    }

    static random_string():string {
        return Math.random().toString(36).substring(2, 15)
    }

    static random_digits(min = 100000, max = 999999):number {
        return Math.floor(min + Math.random() * (max - min))
    }


    getSentCode(email:string, code:string){
        const finded = this.codes.find(x=>(x.email.toString()===email.toString() && x.code.toString()===code.toString()));
        return finded;
    }






    sendVerify(email: string) {
        const code = EmailService.random_digits()+'';
        const finded = this.codes.find(x=>x.email===email);
        if(finded) finded.code = code; else this.codes.unshift({email,code});
        if(this.codes.length>10000) this.codes.pop();

        const url = "https://kaizenfund.io/api/user/email/verify/check?code=" + code+"&email="+email;
        const msg = {
            to:email, // Change to your recipient
            from: 'Kaizen Fund <noreply@kaizenfund.io>', // Change to your verified sender
            subject: 'Email verification',
            text: 'Please confirm your email: '+url ,
            html: '<a href="'+url+'">Confirm your email</a>',
        }
        console.log(msg)
        sgMail
            .send(msg)
            .then(() => {
                console.log('Email sent')
            })
            .catch((error) => {
                console.error(error)
            })
    }

    sendRecovery(email: string) {
        const code = EmailService.random_string()+'';
        const finded = this.codes.find(x=>x.email===email);
        if(finded) finded.code = code; else this.codes.unshift({email,code});
        if(this.codes.length>10000) this.codes.pop();

        const url = "https://kaizenfund.io/new-password?code=" + code + "&email="+email;
        const msg = {
            to:email, // Change to your recipient
            from: 'Kaizen Fund <noreply@kaizenfund.io>', // Change to your verified sender
            subject: 'Change password',
            text: 'Click to link for set new password: '+url ,
            html: '<a href="'+url+'">Set new password</a>',
        }
        console.log(msg)
        sgMail
            .send(msg)
            .then(() => {
                console.log('Email sent')
            })
            .catch((error) => {
                console.error(error)
            })
    }

    async sendApply(dto: ApplyProduct) {
          const msg = {
            to:dto.email, // Change to your recipient
            from: 'Kaizen Fund <noreply@kaizenfund.io>', // Change to your verified sender
            subject: 'New apply'+(dto.service?(' ('+dto.service+")"):''),
            text: Object.keys(dto).map(x=>x+": "+dto[x]).join("<br/>")+"<br/><br/>Kaizen Fund https://kaizenfund.io/",
            html: Object.keys(dto).map(x=>"<b>"+x+"</b>: "+dto[x]).join("<br/>")+"<br/><br/><a href='https://kaizenfund.io'>Kaizen Fund </a>",
        }
        sgMail
            .send(msg)
            .then(() => {
                console.log('Email sent')
            })
            .catch((error) => {
                console.error(error)
            })
    }
}
