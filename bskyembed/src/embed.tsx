import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyGraphDefs,
  AppBskyLabelerDefs,
} from '@atproto/api'
import {ComponentChildren, h} from 'preact'

import {Link} from './link'

export function Embed({content}: {content: AppBskyFeedDefs.PostView['embed']}) {
  if (!content) return null

  try {
    // Case 1: Image
    if (AppBskyEmbedImages.isView(content)) {
      return <ImageEmbed content={content} />
    }

    // Case 2: External link
    if (AppBskyEmbedExternal.isView(content)) {
      return <ExternalEmbed content={content} />
    }

    // Case 3: Record (quote or linked post)
    if (AppBskyEmbedRecord.isView(content)) {
      const record = content.record

      // Case 3.1: Post
      if (AppBskyEmbedRecord.isViewRecord(record)) {
        let text
        if (AppBskyFeedPost.isRecord(record.value)) {
          text = record.value.text
        }
        return (
          <Link
            href={`/profile/${record.author.did}/post/${getRkey(record)}`}
            className="transition-colors hover:bg-neutral-100 border rounded-lg p-2 gap-1.5 w-full flex flex-col">
            <div className="flex gap-1.5 items-center">
              <img
                src={record.author.avatar}
                className="w-4 h-4 rounded-full bg-neutral-300 shrink-0"
              />
              <p className="line-clamp-1 text-sm">
                <span className="font-bold">{record.author.displayName}</span>
                <span className="text-textLight ml-1">
                  @{record.author.handle}
                </span>
              </p>
            </div>
            {text && <p className="text-sm">{text}</p>}
            {record.embeds
              ?.filter(embed => {
                if (AppBskyEmbedImages.isView(embed)) return true
                if (AppBskyEmbedExternal.isView(embed)) return true
                return false
              })
              .map(embed => (
                <Embed key={embed.$type} content={embed} />
              ))}
          </Link>
        )
      }

      // Case 3.2: List
      if (AppBskyGraphDefs.isListView(record)) {
        return (
          <GenericWithImage
            image={record.avatar}
            title={record.name}
            href={`/profile/${record.creator.did}/lists/${getRkey(record)}`}
            subtitle={
              record.purpose === AppBskyGraphDefs.CURATELIST
                ? `Moderation list by @${record.creator.handle}`
                : `User list by @${record.creator.handle}`
            }
            description={record.description}
          />
        )
      }

      // Case 3.3: Feed
      if (AppBskyFeedDefs.isGeneratorView(record)) {
        return (
          <GenericWithImage
            image={record.avatar}
            title={record.displayName}
            href={`/profile/${record.creator.did}/feed/${getRkey(record)}`}
            subtitle={`Feed by @${record.creator.handle}`}
            description={`Liked by ${record.likeCount ?? 0} users`}
          />
        )
      }

      // Case 3.4: Labeler
      // I don't think this is used, but leaving it here just in case
      if (AppBskyLabelerDefs.isLabelerView(record)) {
        return (
          <GenericWithImage
            image={record.creator.avatar}
            title={record.creator.displayName || record.creator.handle}
            href={`/profile/${record.creator.did}`}
            subtitle="Labeler"
          />
        )
      }

      // Case 3.5: Post not found
      if (AppBskyEmbedRecord.isViewNotFound(record)) {
        return (
          <GenericBox>
            Quoted post not found - it may have been deleted
          </GenericBox>
        )
      }

      // Case 3.6: Post blocked
      if (AppBskyEmbedRecord.isViewBlocked(record)) {
        return <GenericBox>The quoted post is blocked</GenericBox>
      }

      throw new Error('Unknown embed type')
    }

    // Case 4: Record with media
    if (AppBskyEmbedRecordWithMedia.isView(content)) {
      return (
        <div className="flex flex-col gap-2">
          <Embed content={content.media} />
          <Embed
            content={{
              $type: 'app.bsky.embed.record#view',
              record: content.record.record,
            }}
          />
        </div>
      )
    }

    throw new Error('Unsupported embed type')
  } catch (err) {
    // console.error("Error rendering embed", content);
    return (
      <GenericBox>
        {err instanceof Error ? err.message : 'An error occurred'}
      </GenericBox>
    )
  }
}

function GenericBox({children}: {children: ComponentChildren}) {
  return (
    <div className="w-full rounded-lg border py-2 px-4">
      <p>{children}</p>
    </div>
  )
}

function ImageEmbed({content}: {content: AppBskyEmbedImages.View}) {
  switch (content.images.length) {
    case 1:
      return (
        <img
          src={content.images[0].thumb}
          alt={content.images[0].alt}
          className="w-full rounded-lg overflow-hidden object-cover h-auto max-h-[1000px]"
        />
      )
    case 2:
      return (
        <div className="flex gap-1 rounded-lg overflow-hidden w-full aspect-[2/1]">
          {content.images.map((image, i) => (
            <img
              key={i}
              src={image.thumb}
              alt={image.alt}
              className="w-1/2 h-full object-cover rounded-sm"
            />
          ))}
        </div>
      )
    case 3:
      return (
        <div className="flex gap-1 rounded-lg overflow-hidden w-full aspect-[2/1]">
          <img
            src={content.images[0].thumb}
            alt={content.images[0].alt}
            className="flex-[3] object-cover rounded-sm"
          />
          <div className="flex flex-col gap-1 flex-[2]">
            {content.images.slice(1).map((image, i) => (
              <img
                key={i}
                src={image.thumb}
                alt={image.alt}
                className="w-full h-full object-cover rounded-sm"
              />
            ))}
          </div>
        </div>
      )
    case 4:
      return (
        <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
          {content.images.map((image, i) => (
            <img
              key={i}
              src={image.thumb}
              alt={image.alt}
              className="aspect-square w-full object-cover rounded-sm"
            />
          ))}
        </div>
      )
    default:
      return null
  }
}

function ExternalEmbed({content}: {content: AppBskyEmbedExternal.View}) {
  function toNiceDomain(url: string): string {
    try {
      const urlp = new URL(url)
      return urlp.host ? urlp.host : url
    } catch (e) {
      return url
    }
  }
  return (
    <Link
      href={content.external.uri}
      className="w-full rounded-lg overflow-hidden border flex flex-col items-stretch">
      {content.external.thumb && (
        <img
          src={content.external.thumb}
          className="aspect-[1.91/1] object-cover"
        />
      )}
      <div className="py-3 px-4">
        <p className="text-sm text-textLight line-clamp-1">
          {toNiceDomain(content.external.uri)}
        </p>
        <p className="font-semibold line-clamp-3">{content.external.title}</p>
        <p className="text-sm text-textLight line-clamp-2 mt-0.5">
          {content.external.description}
        </p>
      </div>
    </Link>
  )
}

function GenericWithImage({
  title,
  subtitle,
  href,
  image,
  description,
}: {
  title: string
  subtitle: string
  href: string
  image?: string
  description?: string
}) {
  return (
    <Link
      href={href}
      className="w-full rounded-lg border py-2 px-3 flex flex-col gap-2">
      <div className="flex gap-2.5 items-center">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-8 h-8 rounded-md bg-neutral-300 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-md bg-brand shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-bold text-sm">{title}</p>
          <p className="text-textLight text-sm">{subtitle}</p>
        </div>
      </div>
      {description && <p className="text-textLight text-sm">{description}</p>}
    </Link>
  )
}

function getRkey({uri}: {uri: string}): string {
  return uri.split('/').pop() as string
}
