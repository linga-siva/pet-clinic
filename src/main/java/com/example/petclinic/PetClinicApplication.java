package com.example.petclinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PetClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(PetClinicApplication.class, args);
        System.out.println("what");
        System.out.println("will it work");
        try{
        int divideByZero = 0/33;
      }
      catch(Exception e)
      {
        System.out.println("divide by zero error");
      }

    }

}
