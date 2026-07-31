FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY MioDesk.API.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish MioDesk.API.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish ./

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "dotnet MioDesk.API.dll --urls http://0.0.0.0:${PORT:-10000}"]
