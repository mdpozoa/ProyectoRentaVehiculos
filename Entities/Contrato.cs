using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("contrato")]
    public class Contrato : BaseModel
    {
        [PrimaryKey("id_contrato", true)]
        [JsonPropertyName("ID_Contrato")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public int IdContrato { get; set; }

        [Column("id_reserva")]
        [JsonPropertyName("ID_Reserva")]
        public int IdReserva { get; set; }

        [Column("ter_con_contrato")]
        [JsonPropertyName("Ter_Con_Contrato")]
        public string TerConContrato { get; set; } = string.Empty;

        [Column("firma_contrato")]
        [JsonPropertyName("Firma_Contrato")]   // ← corregido, antes decía "F_Emision_Factura"
        public string FirmaContrato { get; set; } = string.Empty;
    }
}