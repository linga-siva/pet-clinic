package com.example.petclinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootApplication
public class PetClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(PetClinicApplication.class, args);
        System.out.println("what");
        System.out.println("will it work");
        try{
        int divideByZero = 0/100;
      }
      catch(Exception e)
      {
        System.out.println("divide by zero error");
      }

      ObjectMapper mapper = new ObjectMapper();

        // ---- DESERIALIZATION TEST ----
        String jsonInput = """
            {
              "username": "x",
              "age_years": 30
            }
            """;

        User user = mapper.readValue(jsonInput, User.class);

        System.out.println("After deserialization:");
        System.out.println("UserName = " + user.getUserName());
        System.out.println("Age = " + user.getAge());

        // ---- SERIALIZATION TEST ----
        String jsonOutput = mapper.writerWithDefaultPrettyPrinter()
                                  .writeValueAsString(user);

        System.out.println("\nAfter serialization:");
        System.out.println(jsonOutput);

    }

}

class User {

    @JsonProperty("user_name")          // used for serialization
    @JsonAlias({"username", "userName"}) // accepted during deserialization
    private String userName;

    @JsonAlias({"age_years", "years"})
    private int age;

    // getters & setters
    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }
}
