# WEAPON

## GET /api/weapons

Get all weapons information

Response

```json
{
    "msg": "Success",
    "data": [
        {
            "uuid": "string",
            "weaponType": "1",
            "weaponName": "AK-47"
        }
    ]
}
```

## POST /api/weapons

Insert one weapon

Header
- Content-Type: Application/JSON

Request

```json
{
    "weaponType": 1,
    "weaponName": "AK-47"
}
```

Response

```json
{
    "msg": "Success",
}
```

## POST /api/weapons/upload

Bulk insert by uploading an CSV file, every entry consist of weaponType and weaponName 

Header
- Content-Type: Application/X-WWW-Form-Urlencoded

Response

```json
{
    "msg": "Success",
}
```

# CAMO

## GET /api/camos

Get all camos information

Response

```json
{
    "msg": "Success",
    "data": [
        {
            "uuid": "string",
            "itemType": "weapon|glove|character",
            "camoID": "1",
            "camoName": "Wild"
        }
    ]
}
```

## POST /api/camos

Insert one camo

Header
- Content-Type: Application/JSON

Request

```json
{
    "itemType": "weapon|glove|character",
    "camoID": "1",
    "camoName": "Wild"
}
```

Response

```json
{
    "msg": "Success",
}
```

## POST /api/camos/upload

Bulk insert by uploading an CSV file, every entry consist of itemType, camoID, and camoName 

Header
- Content-Type: Application/X-WWW-Form-Urlencoded

Response

```json
{
    "msg": "Success",
}
```

# SKIN

## GET /api/skins

Get skins information filter by itemType and weaponType

Query
- itemType: string
- weaponType: number

Response

```js
{
    "msg": "Success",
    "data": Skin
        & {
            "camo": Camo
        } 
        & {
            "weapon": Weapon
        }[]
}
```

## POST /api/skins

Insert one skin

Header
- Content-Type: Application/JSON

Request

```json
{
    "itemType": "string",
    "weaponType": 1,
    "camoID": 1
}
```

Response

```json
{
    "msg": "Success",
}
```
