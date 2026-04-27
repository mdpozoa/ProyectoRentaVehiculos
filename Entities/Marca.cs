using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("marca")]
    public class Marca : BaseModel
    {
        [PrimaryKey("id_marca", false)]
        [JsonPropertyName("ID_Marca")]
        public int IdMarca { get; set; }

        [Column("nombre_marca")]
        [JsonPropertyName("Nombre_Marca")]
        public string NombreMarca { get; set; } = string.Empty;
    }
}
