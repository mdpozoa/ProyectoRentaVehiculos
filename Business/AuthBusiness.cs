using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System;
using Microsoft.Extensions.Configuration;
using ProyectoRentaVehiculos.DataAccess;

namespace ProyectoRentaVehiculos.Business
{
    public class AuthBusiness
    {
        private readonly AuthDA _authDA;
        private readonly IConfiguration _config;

        public AuthBusiness(AuthDA authDA, IConfiguration config)
        {
            _authDA = authDA;
            _config = config;
        }

        public async Task<(string Token, string Rol)> Login(string user, string pass)
        {
            var usuario = await _authDA.LoginAsync(user, pass);
            if (usuario == null)
            {
                throw new Exception("Credenciales inválidas o usuario no existe");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("id", usuario.IdUsuario.ToString()),
                new Claim("username", usuario.UserUsuario!),
                new Claim("rol", usuario.RolUsuario!)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: creds
            );

            return (new JwtSecurityTokenHandler().WriteToken(token), usuario.RolUsuario!);
        }
    }
}
