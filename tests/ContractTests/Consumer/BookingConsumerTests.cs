using System.Net.Http;
using System.Threading.Tasks;
using PactNet;
using Xunit;
using Xunit.Abstractions;
using System.IO;

namespace ContractTests.Consumer;

public class BookingConsumerTests
{
    private readonly string _pactDir = @"C:\Temp\pacts";
    private readonly IPactBuilderV3 _pactBuilder;

    public BookingConsumerTests(ITestOutputHelper output)
    {
        if (!Directory.Exists(_pactDir)) Directory.CreateDirectory(_pactDir);
        var config = new PactConfig
        {
            PactDir = _pactDir,
            Outputters = new[] { new XunitOutputWrapper(output) }
        };
        _pactBuilder = Pact.V3("Booking-Consumer", "CatalogoVehiculos-Provider", config).WithHttpInteractions();
    }

    [Fact]
    [Trait("Category", "Contract")]
    public async Task AllInteractions_ShouldPassAndWritePactFile()
    {
        // 1. GetVehiculos
        _pactBuilder
            .UponReceiving("una solicitud GET de vehiculos disponibles")
                .Given("existen vehiculos disponibles")
                .WithRequest(HttpMethod.Get, "/api/v1/vehiculos")
                .WithQuery("disponible", "true")
            .WillRespond()
                .WithStatus(200)
                .WithHeader("Content-Type", "application/json; charset=utf-8")
                .WithJsonBody(new
                {
                    success = true,
                    data = PactNet.Matchers.Match.MinType(new
                    {
                        id = PactNet.Matchers.Match.Type("1"),
                        nombre = PactNet.Matchers.Match.Type("Toyota Corolla"),
                        precioPorDia = PactNet.Matchers.Match.Decimal(45.0),
                        disponible = true,
                        categoria = PactNet.Matchers.Match.Type("Sedan")
                    }, 1)
                });

        // 2. GetVehiculoById
        _pactBuilder
            .UponReceiving("una solicitud GET de vehiculo por ID existente")
                .Given("existe un vehiculo con ID 1")
                .WithRequest(HttpMethod.Get, "/api/v1/vehiculos/1")
            .WillRespond()
                .WithStatus(200)
                .WithHeader("Content-Type", "application/json; charset=utf-8")
                .WithJsonBody(new
                {
                    success = true,
                    data = new
                    {
                        id = PactNet.Matchers.Match.Type("1"),
                        nombre = PactNet.Matchers.Match.Type("Toyota Corolla"),
                        precioPorDia = PactNet.Matchers.Match.Decimal(45.0),
                        disponible = PactNet.Matchers.Match.Type(true),
                        moneda = "USD"
                    }
                });

        // 3. GetDisponibilidad
        _pactBuilder
            .UponReceiving("una solicitud de disponibilidad de vehiculo en rango de fechas")
                .Given("existe un vehiculo con ID 1 disponible")
                .WithRequest(HttpMethod.Get, "/api/v1/vehiculos/1/disponibilidad")
                .WithQuery("fechaInicio", "2026-06-01")
                .WithQuery("fechaFin", "2026-06-05")
            .WillRespond()
                .WithStatus(200)
                .WithJsonBody(new
                {
                    success = true,
                    data = new
                    {
                        disponible = PactNet.Matchers.Match.Type(true),
                        mensaje = PactNet.Matchers.Match.Type("El vehiculo esta disponible para las fechas solicitadas.")
                    }
                });

        // 4. CreateReserva
        _pactBuilder
            .UponReceiving("una solicitud POST para crear una reserva")
                .Given("existen usuarios, agencias y vehiculos validos")
                .WithRequest(HttpMethod.Post, "/api/Reservas")
                .WithHeader("Content-Type", "application/json; charset=utf-8")
                .WithJsonBody(new
                {
                    iD_Usuario = 1,
                    iD_Vehiculo = 1,
                    iD_Agencia = 1,
                    f_Inicio_Reserva = "2026-06-01T10:00:00Z",
                    f_Final_Reserva = "2026-06-05T10:00:00Z",
                    estado_Reserva = "Pendiente"
                })
            .WillRespond()
                .WithStatus(201)
                .WithHeader("Content-Type", "application/json; charset=utf-8")
                .WithJsonBody(new
                {
                    iD_Reserva = PactNet.Matchers.Match.Type(100),
                    iD_Usuario = PactNet.Matchers.Match.Type(1),
                    iD_Vehiculo = PactNet.Matchers.Match.Type(1),
                    iD_Agencia = PactNet.Matchers.Match.Type(1),
                    f_Inicio_Reserva = PactNet.Matchers.Match.Type("2026-06-01T10:00:00Z"),
                    f_Final_Reserva = PactNet.Matchers.Match.Type("2026-06-05T10:00:00Z"),
                    estado_Reserva = PactNet.Matchers.Match.Type("Pendiente")
                });

        // 5. DeleteReserva
        _pactBuilder
            .UponReceiving("una solicitud DELETE para cancelar una reserva")
                .Given("existe una reserva con ID 100")
                .WithRequest(HttpMethod.Delete, "/api/Reservas/100")
            .WillRespond()
                .WithStatus(204);

        // Execute all interactions sequentially on the same mock server
        await _pactBuilder.VerifyAsync(async ctx =>
        {
            using var client = new HttpClient { BaseAddress = ctx.MockServerUri };
            
            // 1
            var resp1 = await client.GetAsync("/api/v1/vehiculos?disponible=true");
            Assert.Equal(System.Net.HttpStatusCode.OK, resp1.StatusCode);
            
            // 2
            var resp2 = await client.GetAsync("/api/v1/vehiculos/1");
            Assert.Equal(System.Net.HttpStatusCode.OK, resp2.StatusCode);
            
            // 3
            var resp3 = await client.GetAsync("/api/v1/vehiculos/1/disponibilidad?fechaInicio=2026-06-01&fechaFin=2026-06-05");
            Assert.Equal(System.Net.HttpStatusCode.OK, resp3.StatusCode);
            
            // 4
            var content = new StringContent("{\"iD_Usuario\":1,\"iD_Vehiculo\":1,\"iD_Agencia\":1,\"f_Inicio_Reserva\":\"2026-06-01T10:00:00Z\",\"f_Final_Reserva\":\"2026-06-05T10:00:00Z\",\"estado_Reserva\":\"Pendiente\"}", System.Text.Encoding.UTF8, "application/json");
            var resp4 = await client.PostAsync("/api/Reservas", content);
            Assert.Equal(System.Net.HttpStatusCode.Created, resp4.StatusCode);
            
            // 5
            var resp5 = await client.DeleteAsync("/api/Reservas/100");
            Assert.Equal(System.Net.HttpStatusCode.NoContent, resp5.StatusCode);
        });
    }
}

public class XunitOutputWrapper : PactNet.Infrastructure.Outputters.IOutput
{
    private readonly ITestOutputHelper _output;
    public XunitOutputWrapper(ITestOutputHelper output) { _output = output; }
    public void WriteLine(string line) { _output.WriteLine(line); }
}
