using PactNet;
using PactNet.Verifier;
using Xunit;
using Xunit.Abstractions;

namespace ContractTests.Provider;

/// <summary>
/// Contract Testing — Provider: CatalogoVehiculos
/// Verifica que el microservicio honra los pacts generados por el consumidor Booking.
/// Para ejecutar: levanta CatalogoVehiculos en http://localhost:5001 primero.
/// </summary>
public class VehiculosProviderTests(ITestOutputHelper output)
{
    private readonly Uri _providerUri = new("http://localhost:5001");
    private readonly string _pactDir  = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Consumer", "pacts");

    [Fact]
    [Trait("Category", "ProviderContract")]
    public void VerifyPactWithBookingConsumer()
    {
        // Requiere que el servicio CatalogoVehiculos esté corriendo en :5001
        var config = new PactVerifierConfig
        {
            Outputters = new[] { new ContractTests.Consumer.XunitOutputWrapper(output) }
        };

        var pactFile = Path.Combine(
            Directory.GetCurrentDirectory(), "pacts",
            "Booking-Consumer-CatalogoVehiculos-Provider.json");

        if (!File.Exists(pactFile))
        {
            output.WriteLine($"[SKIP] Pact file not found at {pactFile}. Run consumer tests first.");
            return;
        }

        new PactVerifier("CatalogoVehiculos-Provider", config)
            .WithHttpEndpoint(_providerUri)
            .WithFileSource(new FileInfo(pactFile))
            .WithProviderStateUrl(new Uri(_providerUri, "/provider-states"))
            .Verify();
    }
}
