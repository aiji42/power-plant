import { prepare } from '@sb-prisma/client'

export { createClient, sb } from '@sb-prisma/client'

const operationMapping = {
  aggregateProduct: {
    model: 'Product',
    method: 'aggregate'
  },
  createManyProduct: {
    model: 'Product',
    method: 'createMany'
  },
  createOneProduct: {
    model: 'Product',
    method: 'createOne'
  },
  deleteManyProduct: {
    model: 'Product',
    method: 'deleteMany'
  },
  deleteOneProduct: {
    model: 'Product',
    method: 'deleteOne'
  },
  findFirstProduct: {
    model: 'Product',
    method: 'findFirst'
  },
  findManyProduct: {
    model: 'Product',
    method: 'findMany'
  },
  findUniqueProduct: {
    model: 'Product',
    method: 'findUnique'
  },
  groupByProduct: {
    model: 'Product',
    method: 'groupBy'
  },
  updateManyProduct: {
    model: 'Product',
    method: 'updateMany'
  },
  updateOneProduct: {
    model: 'Product',
    method: 'updateOne'
  },
  upsertOneProduct: {
    model: 'Product',
    method: 'upsertOne'
  }
}
const models = {
  Product: {
    name: 'Product',
    dbName: null,
    isGenerated: false,
    primaryKey: null,
    uniqueFields: [],
    uniqueIndexes: [],
    fields: {
      id: {
        name: 'id',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: true,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: true,
        default: { name: 'uuid', args: [] },
        isGenerated: false,
        isUpdatedAt: false
      },
      code: {
        name: 'code',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isUnique: true,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      isDownloaded: {
        name: 'isDownloaded',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'Boolean',
        hasDefaultValue: true,
        default: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      isLiked: {
        name: 'isLiked',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'Boolean',
        hasDefaultValue: true,
        default: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      createdAt: {
        name: 'createdAt',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'DateTime',
        hasDefaultValue: true,
        default: { name: 'now', args: [] },
        isGenerated: false,
        isUpdatedAt: false
      },
      updatedAt: {
        name: 'updatedAt',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'DateTime',
        hasDefaultValue: true,
        default: { name: 'now', args: [] },
        isGenerated: false,
        isUpdatedAt: true
      },
      title: {
        name: 'title',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      maker: {
        name: 'maker',
        kind: 'scalar',
        isList: false,
        isRequired: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      series: {
        name: 'series',
        kind: 'scalar',
        isList: false,
        isRequired: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      genres: {
        name: 'genres',
        kind: 'scalar',
        isList: true,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      url: {
        name: 'url',
        kind: 'scalar',
        isList: false,
        isRequired: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      mediaUrls: {
        name: 'mediaUrls',
        kind: 'scalar',
        isList: true,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      mainImageUrl: {
        name: 'mainImageUrl',
        kind: 'scalar',
        isList: false,
        isRequired: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      subImageUrls: {
        name: 'subImageUrls',
        kind: 'scalar',
        isList: true,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      releasedAt: {
        name: 'releasedAt',
        kind: 'scalar',
        isList: false,
        isRequired: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'DateTime',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      length: {
        name: 'length',
        kind: 'scalar',
        isList: false,
        isRequired: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'Int',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      isProcessing: {
        name: 'isProcessing',
        kind: 'scalar',
        isList: false,
        isRequired: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'Boolean',
        hasDefaultValue: true,
        default: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      downloadUrl: {
        name: 'downloadUrl',
        kind: 'scalar',
        isList: false,
        isRequired: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      },
      casts: {
        name: 'casts',
        kind: 'scalar',
        isList: true,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        type: 'String',
        hasDefaultValue: false,
        isGenerated: false,
        isUpdatedAt: false
      }
    }
  }
}
prepare({
  endpoint: process.env.SUPABASE_URL,
  apikey: process.env.SUPABASE_API_KEY,
  //@ts-ignore
  fetch,
  modelMap: {
    operationMapping,
    models
  }
})
