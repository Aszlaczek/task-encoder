# Etap build: kompilacja aplikacji (testy uruchamiane osobno przez mvnw test)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw

# Pobranie zależności osobno pomaga wykorzystać cache warstw Dockera
RUN ./mvnw -q -B dependency:go-offline

COPY src src
RUN ./mvnw -q -B -DskipTests package

# Etap runtime: lekki obraz JRE
FROM eclipse-temurin:21-jre
WORKDIR /app

# curl potrzebne do healthchecka kontenera backendu w docker-compose
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
