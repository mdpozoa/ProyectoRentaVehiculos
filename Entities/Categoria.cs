using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("categoria")]
    public class Categoria : BaseModel
    {
        [PrimaryKey("id_categoria", false)]
        [JsonPropertyName("ID_Categoria")]
        public int IdCategoria { get; set; }

        [Column("nombre_categoria")]
        [JsonPropertyName("Nombre_Categoria")]
        public string NombreCategoria { get; set; } = string.Empty;

        [Column("descripcion_categoria")]
        [JsonPropertyName("Descripcion_Categoria")]
        public string DescripcionCategoria { get; set; } = string.Empty;
    }
}
